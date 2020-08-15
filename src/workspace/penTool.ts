import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { createShapeLayerShape } from "~/composition/path/shapeLayerPath";
import { transformMat2 } from "~/composition/transformUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { shapeActions } from "~/shape/shapeReducer";
import { shapeSelectionActions } from "~/shape/shapeSelectionReducer";
import { ShapeControlPoint, ShapeEdge, ShapeGraph, ShapeNode } from "~/shape/shapeTypes";
import {
	getShapeContinuePathFrom,
	getShapeLayerShapeIds,
	getShapeNodeToEdges,
	getShapePathClosePathNode,
	getShapeSelectionFromState,
} from "~/shape/shapeUtils";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { LayerType, PropertyGroupName } from "~/types";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { createGenMapIdFn, createMapNumberId } from "~/util/mapUtils";
import { getDistance, quadraticToCubicBezier } from "~/util/math";
import { globalToWorkspacePosition } from "~/workspace/workspaceUtils";

export const penToolHandlers = {
	onMouseDown: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		// See if a single shape layer is selected
		//
		// If multiple (shape) layers are selected, we create a new shape layer.

		const { compositionState, compositionSelectionState } = getActionState();
		const areaState = getAreaActionState<AreaType.Workspace>(areaId);

		const { compositionId } = areaState;

		const selection = getCompSelectionFromState(compositionId, compositionSelectionState);
		const selectedLayers = Object.keys(selection.layers);

		const selectedShapeLayers = selectedLayers.filter((layerId) => {
			const layer = compositionState.layers[layerId];
			return layer.type === LayerType.Shape;
		});

		if (selectedShapeLayers.length === 1) {
			penToolHandlers.onShapeLayerMouseDown(e, selectedShapeLayers[0], areaId, viewport);
			return;
		}

		// Create new shape layer
		penToolHandlers.mouseDownCreateShapeLayer(e, areaId, viewport);
	},

	onShapeLayerMouseDown: (
		e: React.MouseEvent,
		layerId: string,
		areaId: string,
		viewport: Rect,
	) => {
		const actionState = getActionState();
		const { compositionState, shapeState, shapeSelectionState } = actionState;
		const areaState = getAreaActionState<AreaType.Workspace>(areaId);

		const { compositionId, scale, pan: _pan } = areaState;
		const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

		const shapeIds = getShapeLayerShapeIds(layerId, compositionState);

		const composition = compositionState.compositions[compositionId];
		const map = getCompositionRenderValues(
			actionState,
			compositionId,
			composition.frameIndex,
			{
				width: composition.width,
				height: composition.height,
			},
			{ recursive: false },
		);

		const transform = map.transforms[layerId].transform[0];
		const mat2 = transformMat2(transform);
		const translateToViewport = (vec: Vec2): Vec2 => {
			return mat2.multiplyVec2(vec).add(transform.translate).scale(scale).add(pan);
		};

		const mousePosition = Vec2.fromEvent(e).sub(Vec2.new(viewport.left, viewport.top));

		for (const shapeId of shapeIds) {
			const shape = shapeState.shapes[shapeId];

			// Check if the control point of any edge was hit

			for (const edgeId of shape.edges) {
				const edge = shapeState.edges[edgeId];
				const cp0 = shapeState.controlPoints[edge.cp0];
				const cp1 = shapeState.controlPoints[edge.cp1];

				const edgeParts: Array<[string, ShapeControlPoint | undefined]> = [
					[edge.n0, cp0],
					[edge.n1, cp1],
				];

				for (const [nodeId, cp] of edgeParts) {
					if (!nodeId || !cp) {
						continue;
					}

					const node = shapeState.nodes[nodeId];
					const position = node.position.add(cp.position);

					if (
						getDistance(
							mousePosition,
							translateToViewport(position.add(transform.translate)),
						) < 5
					) {
						penToolHandlers.controlPointMouseDown(e, cp.id, areaId, viewport);
						return;
					}
				}
			}

			// Check if any node was hit

			for (const nodeId of shape.nodes) {
				const node = shapeState.nodes[nodeId];
				const position = node.position;

				if (getDistance(mousePosition, translateToViewport(position)) < 5) {
					penToolHandlers.nodeMouseDown(e, layerId, nodeId, areaId, viewport);
					return;
				}
			}
		}

		const continuePathFrom = getShapeContinuePathFrom(
			shapeIds,
			shapeState,
			shapeSelectionState,
		);

		if (!continuePathFrom) {
			// Nothing was hit, clear the selection and create a new path on the shape layer.
			penToolHandlers.createNewPathOnShapeLayer(e, layerId, areaId, viewport);
			return;
		}

		const [nodeId, preferControlPoint] = continuePathFrom;

		// Should continue node
		penToolHandlers.continuePath(e, nodeId, preferControlPoint, areaId, viewport);
	},

	controlPointMouseDown: (e: React.MouseEvent, cpId: string, areaId: string, viewport: Rect) => {
		if (isKeyDown("Alt")) {
			requestAction({ history: true }, (params) => {
				const { shapeState } = getActionState();
				const cp = shapeState.controlPoints[cpId]!;
				const edge = shapeState.edges[cp.edgeId];
				const which = edge.cp0 === cpId ? "cp0" : "cp1";

				params.dispatch(
					shapeActions.removeControlPoint(cpId),
					shapeActions.setEdgeControlPointId(cp!.edgeId, which, ""),
				);

				if (which === "cp0" && !edge.n1) {
					// Removing cp of stray edge, remove edge entirely
					params.dispatch(shapeActions.removeEdge(edge.shapeId, cp.edgeId));
				}

				params.submitAction("Remove control point");
			});
			return;
		}

		const { pan, scale } = getAreaActionState<AreaType.Workspace>(areaId);

		const { shapeState, shapeSelectionState } = getActionState();

		const cp = shapeState.controlPoints[cpId]!;
		const edge = shapeState.edges[cp.edgeId];
		const shapeId = edge.shapeId;

		let selection = getShapeSelectionFromState(shapeId, shapeSelectionState);

		const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");
		const willBeSelected = additiveSelection ? !selection.controlPoints[cpId] : true;

		const clearShapeSelection = (params: RequestActionParams) => {
			params.dispatch(shapeSelectionActions.clearShapeSelection(shapeId));
		};
		const addCpToSelection = (params: RequestActionParams) => {
			params.dispatch(shapeSelectionActions.addControlPointToSelection(shapeId, cpId));
		};
		const removeCpFromSelection = (params: RequestActionParams) => {
			params.dispatch(shapeSelectionActions.removeControlPointFromSelection(shapeId, cpId));
		};

		mouseDownMoveAction(e, {
			keys: ["Shift"],
			translate: (pos) => globalToWorkspacePosition(pos, viewport, scale, pan),
			beforeMove: (params) => {
				if (!additiveSelection && !selection.nodes[cpId]) {
					// The selection is non-additive and the cp will be selected.
					//
					// Clear the selection of all shapes within the composition and then
					// add the cp to the selection.
					clearShapeSelection(params);
					addCpToSelection(params);
					return;
				}

				if (additiveSelection && !willBeSelected) {
					// The selection is additive and the node will NOT be selected.
					//
					// Deselect the node.
					removeCpFromSelection(params);
				} else {
					addCpToSelection(params);
				}

				selection = getShapeSelectionFromState(
					shapeId,
					getActionState().shapeSelectionState,
				);
			},
			mouseMove: (params, { moveVector }) => {
				params.dispatch(shapeActions.setMoveVector(shapeId, moveVector.translated));
			},
			mouseUp: (params, hasMoved) => {
				selection = getShapeSelectionFromState(
					shapeId,
					getActionState().shapeSelectionState,
				);

				if (additiveSelection && !willBeSelected) {
					params.submitAction("Remove control point from shape selection");
					return;
				}

				if (hasMoved) {
					params.dispatch(shapeActions.applyMoveVector(shapeId, selection));
					params.submitAction("Move selected objects in shape");
					return;
				}

				if (!additiveSelection) {
					clearShapeSelection(params);
					addCpToSelection(params);
				}

				params.submitAction("Add control point to shape selection");
			},
		});
	},

	nodeMouseDown: (
		e: React.MouseEvent,
		layerId: string,
		nodeId: string,
		areaId: string,
		viewport: Rect,
	) => {
		const { pan, scale } = getAreaActionState<AreaType.Workspace>(areaId);

		const { compositionState, shapeState, shapeSelectionState } = getActionState();

		const node = shapeState.nodes[nodeId];
		const shapeId = node.shapeId;

		// Check if a single node is selected and the hit node is the close path node.
		const shapeIds = getShapeLayerShapeIds(layerId, compositionState);
		const continueFrom = getShapeContinuePathFrom(shapeIds, shapeState, shapeSelectionState);

		if (continueFrom) {
			const closePathNodeId = getShapePathClosePathNode(continueFrom[0], shapeState);

			if (nodeId === closePathNodeId) {
				penToolHandlers.completePath(e, continueFrom[0], closePathNodeId, areaId, viewport);
				return;
			}
		}

		let selection = getShapeSelectionFromState(shapeId, shapeSelectionState);

		const additiveSelection = isKeyDown("Shift") || isKeyDown("Command");
		const willBeSelected = additiveSelection ? !selection.nodes[nodeId] : true;

		const clearShapeSelection = (params: RequestActionParams) => {
			params.dispatch(shapeSelectionActions.clearShapeSelection(shapeId));
		};
		const addNodeToSelection = (params: RequestActionParams) => {
			params.dispatch(shapeSelectionActions.addNodeToSelection(shapeId, nodeId));
		};
		const removeNodeFromSelection = (params: RequestActionParams) => {
			params.dispatch(shapeSelectionActions.removeNodeFromSelection(shapeId, nodeId));
		};

		mouseDownMoveAction(e, {
			keys: ["Shift"],
			translate: (pos) => globalToWorkspacePosition(pos, viewport, scale, pan),
			beforeMove: (params) => {
				if (!additiveSelection && !selection.nodes[nodeId]) {
					// The selection is non-additive and the node will be selected.
					//
					// Clear the selection of all shapes within the composition and then
					// add the node to the selection.
					clearShapeSelection(params);
					addNodeToSelection(params);
					return;
				}

				if (additiveSelection && !willBeSelected) {
					// The selection is additive and the node will NOT be selected.
					//
					// Deselect the node.
					removeNodeFromSelection(params);
				} else {
					addNodeToSelection(params);
				}

				selection = getShapeSelectionFromState(
					shapeId,
					getActionState().shapeSelectionState,
				);
			},
			mouseMove: (params, { moveVector }) => {
				params.dispatch(shapeActions.setMoveVector(shapeId, moveVector.translated));
			},
			mouseUp: (params, hasMoved) => {
				selection = getShapeSelectionFromState(
					shapeId,
					getActionState().shapeSelectionState,
				);

				if (additiveSelection && !willBeSelected) {
					params.submitAction("Remove node from shape selection");
					return;
				}

				if (hasMoved) {
					params.dispatch(shapeActions.applyMoveVector(shapeId, selection));
					params.submitAction("Move selected objects in shape");
					return;
				}

				if (!additiveSelection) {
					clearShapeSelection(params);
					addNodeToSelection(params);
				}

				params.submitAction("Add node to shape selection");
			},
		});
	},

	continuePath: (
		e: React.MouseEvent,
		fromNodeId: string,
		preferControlPointId: string | undefined,
		areaId: string,
		viewport: Rect,
	) => {
		const { pan, scale } = getAreaActionState<AreaType.Workspace>(areaId);

		const shapeState = getActionState().shapeState;

		const node = shapeState.nodes[fromNodeId];
		const nodeToEdges = getShapeNodeToEdges(node.shapeId, shapeState);

		let useEdgeId: string | undefined;

		if (preferControlPointId) {
			for (const id of nodeToEdges[fromNodeId]) {
				const edge = shapeState.edges[id];

				if (edge.cp0 === preferControlPointId) {
					useEdgeId = id;
					break;
				}
				if (edge.cp1 === preferControlPointId) {
					useEdgeId = id;
					break;
				}
			}

			if (!useEdgeId) {
				throw new Error(
					`Did not find edge with control point '${preferControlPointId}' to continue shape from node '${fromNodeId}'`,
				);
			}
		}

		const { shapeId } = node;

		const newNodeId = createMapNumberId(shapeState.nodes);

		const createEdgeId = createGenMapIdFn(shapeState.edges);
		const createCpId = createGenMapIdFn(shapeState.controlPoints);

		let prevEdgeId = useEdgeId;
		let prevcp0Id!: string;
		let prevcp1Id!: string;

		let nextEdgeId!: string;
		let nextcp0Id!: string;

		mouseDownMoveAction(e, {
			translate: (pos) => globalToWorkspacePosition(pos, viewport, scale, pan),
			keys: [],
			beforeMove: (params, { mousePosition }) => {
				const toDispatch: any[] = [];

				const newNode: ShapeNode = {
					id: newNodeId,
					position: mousePosition.translated,
					shapeId,
				};

				toDispatch.push(shapeActions.addNode(shapeId, newNode));

				if (!prevEdgeId) {
					prevEdgeId = createMapNumberId(shapeState.edges);

					const edge: ShapeEdge = {
						id: prevEdgeId,
						shapeId,
						n0: fromNodeId,
						cp0: "",
						n1: newNodeId,
						cp1: "",
					};
					toDispatch.push(shapeActions.addEdge(shapeId, edge));
				} else {
					const edge = shapeState.edges[prevEdgeId];
					toDispatch.push(
						shapeActions.setEdgeNodeId(prevEdgeId!, edge.n0 ? "n1" : "n0", newNodeId),
					);
				}

				toDispatch.push(
					shapeSelectionActions.clearShapeSelection(shapeId),
					shapeSelectionActions.addNodeToSelection(shapeId, newNodeId),
				);

				params.dispatch(toDispatch);
			},
			mouseMove: (params, { firstMove, moveVector }) => {
				const { shapeState } = getActionState();

				const prevCpPos = moveVector.translated.scale(-1);
				const nextCpPos = moveVector.translated;

				if (firstMove) {
					if (prevEdgeId) {
						const edge = shapeState.edges[prevEdgeId];

						const completeEdge = (id: string, which: "cp0" | "cp1") => {
							const cp: ShapeControlPoint = {
								id,
								edgeId: prevEdgeId!,
								position: moveVector.translated,
							};
							params.dispatch(
								shapeActions.setControlPoint(cp),
								shapeActions.setEdgeControlPointId(prevEdgeId!, which, id),
							);
						};

						if (edge.cp0 === preferControlPointId) {
							prevcp0Id = preferControlPointId;
							prevcp1Id = createCpId();
							completeEdge(prevcp1Id, "cp1");
						} else {
							// cp1 is preferControlPointId
							prevcp0Id = createCpId();
							prevcp1Id = preferControlPointId!;
							completeEdge(prevcp0Id, "cp0");
						}
					} else {
						// Create edge and both control points

						prevEdgeId = createEdgeId();
						prevcp0Id = createCpId();
						prevcp1Id = createCpId();

						const edge: ShapeEdge = {
							id: prevEdgeId,
							shapeId,
							n0: fromNodeId,
							cp0: prevcp0Id,
							n1: newNodeId,
							cp1: prevcp1Id,
						};
						const cp0: ShapeControlPoint = {
							id: prevcp0Id,
							edgeId: prevEdgeId,
							position: prevCpPos,
						};
						const cp1: ShapeControlPoint = {
							id: prevcp1Id,
							edgeId: prevEdgeId,
							position: node.position.lerp(prevCpPos, 0.4),
						};

						params.dispatch(
							shapeActions.addEdge(shapeId, edge),
							shapeActions.setControlPoint(cp0),
							shapeActions.setControlPoint(cp1),
						);
					}

					// Create next edge
					nextEdgeId = createEdgeId();
					nextcp0Id = createCpId();

					const nextEdge: ShapeEdge = {
						id: nextEdgeId,
						shapeId,
						n0: newNodeId,
						cp0: nextcp0Id,
						n1: "",
						cp1: "",
					};
					const nextcp0: ShapeControlPoint = {
						id: nextcp0Id,
						edgeId: nextEdgeId,
						position: moveVector.translated,
					};

					params.dispatch(
						shapeActions.addEdge(shapeId, nextEdge),
						shapeActions.setControlPoint(nextcp0),
						shapeSelectionActions.addControlPointToSelection(shapeId, nextcp0Id),
					);

					return;
				}

				const edge = shapeState.edges[prevEdgeId!];

				const prevWhich = edge.n0 === fromNodeId ? "cp1" : "cp0";
				const nextWhich = "cp0";

				params.dispatch(
					shapeActions.setEdgeControlPointPosition(prevEdgeId!, prevWhich, prevCpPos),
					shapeActions.setEdgeControlPointPosition(nextEdgeId!, nextWhich, nextCpPos),
				);
			},
			mouseUp: (params) => {
				params.submitAction("Do a thing");
			},
		});
	},

	/**
	 * @param n0Id - From
	 * @param n1Id - To
	 */
	completePath: (
		e: React.MouseEvent,
		n0Id: string,
		n1Id: string,
		areaId: string,
		viewport: Rect,
	) => {
		const { pan, scale } = getAreaActionState<AreaType.Workspace>(areaId);

		const shapeState = getActionState().shapeState;

		const { shapeId } = shapeState.nodes[n0Id];
		const nodeToEdges = getShapeNodeToEdges(shapeId, shapeState);

		const createEdgeId = createGenMapIdFn(shapeState.edges);
		const createCpId = createGenMapIdFn(shapeState.controlPoints);

		const n0 = shapeState.nodes[n0Id];
		const n1 = shapeState.nodes[n0Id];

		let n0InitialEdgeId: string | undefined;
		let n1InitialEdgeId: string | undefined;

		let n0InitialCp: Vec2 | undefined;
		let n1InitialCp: Vec2 | undefined;

		let n0rcpId: string | undefined;
		let n1rcpId: string | undefined;
		let cp0Id: string | undefined;
		let cp1Id: string | undefined;
		let rcpId: string | undefined;

		for (const edgeId of nodeToEdges[n0Id]) {
			const edge = shapeState.edges[edgeId];
			if (!edge.n1) {
				n0InitialEdgeId = edgeId;
			} else {
				n0rcpId = edge.n0 === n0Id ? edge.cp0 : edge.cp1;
			}
		}
		for (const edgeId of nodeToEdges[n1Id]) {
			const edge = shapeState.edges[edgeId];
			if (!edge.n1) {
				n1InitialEdgeId = edgeId;
				break;
			} else {
				n1rcpId = edge.n0 === n1Id ? edge.cp0 : edge.cp1;
			}
		}

		if (n0InitialEdgeId) {
			const { cp0 } = shapeState.edges[n0InitialEdgeId];
			n0InitialCp = shapeState.controlPoints[cp0]!.position;
		}
		if (n1InitialEdgeId) {
			const { cp0 } = shapeState.edges[n1InitialEdgeId];
			n1InitialCp = shapeState.controlPoints[cp0]!.position;
		}

		let edgeId!: string;

		mouseDownMoveAction(e, {
			translate: (pos) => globalToWorkspacePosition(pos, viewport, scale, pan),
			keys: [],
			beforeMove: (params) => {
				const toDispatch: any[] = [];
				console.log({ n0InitialEdgeId, n1InitialEdgeId });

				if (n0InitialEdgeId && n1InitialEdgeId) {
					const n0Edge = shapeState.edges[n0InitialEdgeId];
					const n1Edge = shapeState.edges[n1InitialEdgeId];

					console.log({ n0Edge, n1Edge });

					// Remove the stray edge of n1
					toDispatch.push(shapeActions.removeEdge(shapeId, n1InitialEdgeId));

					edgeId = n0InitialEdgeId;
					cp0Id = n0Edge.cp0;
					cp1Id = n1Edge.cp0; // Reuse id
					rcpId = n1rcpId;

					// Connect n0's stray edge to n1
					toDispatch.push(
						shapeActions.setEdgeNodeId(edgeId, "n1", n1Id),
						shapeActions.setEdgeControlPointId(edgeId, "cp1", cp1Id),
					);
				} else if (n0InitialEdgeId) {
					const edge = shapeState.edges[n0InitialEdgeId];

					edgeId = n0InitialEdgeId;
					cp0Id = edge.cp0;
					cp1Id = createCpId();
					rcpId = n1rcpId;

					let position = n0rcpId
						? shapeState.controlPoints[n0rcpId]!.position.scale(-1)
						: undefined;

					if (!position) {
						const [, , p2, p3] = quadraticToCubicBezier(
							n0.position,
							n0.position.add(n0InitialCp!),
							null,
							n1.position,
						);
						position = p2.sub(p3);
					}

					const cp1: ShapeControlPoint = {
						edgeId,
						id: cp1Id,
						position,
					};

					toDispatch.push(
						shapeActions.setEdgeNodeId(edgeId, "n1", n1Id),
						shapeActions.setEdgeControlPointId(edgeId, "cp1", cp1Id),
						shapeActions.setControlPoint(cp1),
					);
				} else if (n1InitialEdgeId) {
					const edge = shapeState.edges[n1InitialEdgeId];
					// here
					edgeId = n1InitialEdgeId;
					cp0Id = createCpId();
					cp1Id = edge.cp0;
					rcpId = n1rcpId;

					let position = n0rcpId
						? shapeState.controlPoints[n0rcpId]!.position.scale(-1)
						: undefined;

					if (!position) {
						const [p0, p1] = quadraticToCubicBezier(
							n0.position,
							null,
							n1.position.add(n1InitialCp!),
							n1.position,
						);
						position = p1.sub(p0);
					}

					const cp0: ShapeControlPoint = {
						edgeId,
						id: cp0Id,
						position,
					};

					toDispatch.push(
						shapeActions.setEdgeNodeId(edgeId, "n1", n0Id),
						shapeActions.setEdgeControlPointId(edgeId, "cp1", cp0Id),
						shapeActions.setControlPoint(cp0),
					);
				} else {
					// Creating edge from nothing, just create a line
					const edge: ShapeEdge = {
						id: createEdgeId(),
						shapeId,
						n0: n0Id,
						n1: n1Id,
						cp0: "",
						cp1: "",
					};
					rcpId = n1rcpId;
					edgeId = edge.id;
					toDispatch.push(shapeActions.addEdge(shapeId, edge));
				}

				params.dispatch(toDispatch);
			},
			mouseMove: (params, { firstMove, moveVector }) => {
				// Either both cp0Id and cp1Id or neither does.
				if (firstMove && !cp0Id && !cp1Id) {
					cp1Id = createCpId();
					const cp1: ShapeControlPoint = {
						id: cp1Id,
						edgeId,
						position: moveVector.translated.scale(-1),
					};
					params.dispatch(
						shapeActions.setEdgeControlPointId(edgeId, "cp1", cp1Id),
						shapeActions.setControlPoint(cp1),
					);

					let position = n0rcpId
						? shapeState.controlPoints[n0rcpId]!.position.scale(-1)
						: undefined;

					if (position) {
						cp0Id = createCpId();
						const cp0: ShapeControlPoint = {
							id: cp0Id,
							edgeId,
							position,
						};

						params.dispatch(
							shapeActions.setEdgeControlPointId(edgeId, "cp0", cp0Id),
							shapeActions.setControlPoint(cp0),
						);
					}
				}

				params.dispatch(
					shapeActions.setControlPointPosition(cp1Id!, moveVector.translated.scale(-1)),
				);

				if (rcpId) {
					params.dispatch(
						shapeActions.setControlPointPosition(rcpId, moveVector.translated),
					);
				}
			},
			mouseUp: (params) => {
				params.submitAction("Close path");
			},
		});
	},

	createNewPathOnShapeLayer: (
		e: React.MouseEvent,
		layerId: string,
		areaId: string,
		viewport: Rect,
	) => {
		console.log("Create new path on shape layer");
	},

	mouseDownCreateShapeLayer: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		const { compositionId, pan, scale } = getAreaActionState<AreaType.Workspace>(areaId);

		const layerId = createMapNumberId(getActionState().compositionState.layers);

		const initialShapeState = getActionState().shapeState;

		const shapeId = createMapNumberId(initialShapeState.shapes);
		const nodeId = createMapNumberId(initialShapeState.nodes);

		const createEdgeId = createGenMapIdFn(initialShapeState.edges);
		const e0Id = createEdgeId();
		const e1Id = createEdgeId();

		const createCpId = createGenMapIdFn(initialShapeState.controlPoints);
		const e0cpId = createCpId();
		const e1cpId = createCpId();

		mouseDownMoveAction(e, {
			translate: (pos) => globalToWorkspacePosition(pos, viewport, scale, pan),
			keys: [],
			beforeMove: (params, { mousePosition }) => {
				// Create and select layer
				params.dispatch(
					compositionActions.createLayer(compositionId, LayerType.Shape),
					compSelectionActions.clearCompositionSelection(compositionId),
					compSelectionActions.addLayerToSelection(compositionId, layerId),
				);

				// Create and select shape
				const shape: ShapeGraph = {
					id: shapeId,
					nodes: [],
					edges: [],
					moveVector: Vec2.new(0, 0),
				};
				const node: ShapeNode = {
					id: nodeId,
					shapeId,
					position: mousePosition.translated,
				};
				params.dispatch(
					shapeActions.setShape(shape),
					shapeActions.addNode(shapeId, node),
					shapeSelectionActions.addNodeToSelection(shape.id, node.id),
				);

				// Get newly created layer
				const { compositionState } = getActionState();
				const layer = compositionState.layers[layerId];

				// Find content group
				const names = layer.properties.map(
					(propertyId) => compositionState.properties[propertyId].name,
				);
				const groupIndex = names.indexOf(PropertyGroupName.Content);
				const contentsGroupId = layer.properties[groupIndex];

				// Create Shape property group
				const { propertyId, propertiesToAdd } = createShapeLayerShape(shapeId, {
					compositionId,
					layerId,
					createId: createGenMapIdFn(compositionState.properties),
				});

				// Add Shape property to contents group and select the Path of the Shape group
				params.dispatch(
					compositionActions.addPropertyToPropertyGroup(
						contentsGroupId,
						propertyId,
						propertiesToAdd,
					),
					compSelectionActions.addPropertyToSelection(compositionId, propertyId),
				);
			},
			mouseMove: (params, { firstMove, moveVector }) => {
				if (firstMove) {
					const e0: ShapeEdge = {
						id: e0Id,
						shapeId,
						n0: nodeId,
						cp0: e0cpId,
						n1: "",
						cp1: "",
					};
					const e1: ShapeEdge = {
						id: e1Id,
						shapeId,
						n0: nodeId,
						cp0: e1cpId,
						n1: "",
						cp1: "",
					};
					const e0cp: ShapeControlPoint = {
						edgeId: e0Id,
						id: e0cpId,
						position: moveVector.translated,
					};
					const e1cp: ShapeControlPoint = {
						edgeId: e1Id,
						id: e1cpId,
						position: moveVector.translated.scale(-1),
					};
					params.dispatch(
						shapeActions.addEdge(shapeId, e0),
						shapeActions.addEdge(shapeId, e1),
						shapeActions.setControlPoint(e0cp),
						shapeActions.setControlPoint(e1cp),
						shapeSelectionActions.addEdgeToSelection(shapeId, e0.id),
						shapeSelectionActions.addControlPointToSelection(shapeId, e0cpId),
					);
				} else {
					params.dispatch(
						shapeActions.setControlPointPosition(e0cpId, moveVector.translated),
						shapeActions.setControlPointPosition(
							e1cpId,
							moveVector.translated.scale(-1),
						),
					);
				}
			},
			mouseUp: (params) => {
				params.submitAction("Create shape layer");
			},
		});
	},
};
