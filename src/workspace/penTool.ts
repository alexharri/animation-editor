import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { createShapeLayerShape } from "~/composition/path/shapeLayerPath";
import { transformMat2 } from "~/composition/transformUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { shapeActions } from "~/shape/shapeReducer";
import { shapeSelectionActions } from "~/shape/shapeSelectionReducer";
import { ShapeControlPoint, ShapeEdge, ShapeGraph, ShapeNode } from "~/shape/shapeTypes";
import { getShapeNodeToEdges, getShapeSelectionFromState } from "~/shape/shapeUtils";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { LayerType, PropertyGroupName, PropertyName } from "~/types";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { createGenMapIdFn, createMapNumberId } from "~/util/mapUtils";
import { getDistance } from "~/util/math";
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
		shapeLayerId: string,
		areaId: string,
		viewport: Rect,
	) => {
		const actionState = getActionState();
		const { compositionState, shapeState, shapeSelectionState } = actionState;
		const areaState = getAreaActionState<AreaType.Workspace>(areaId);

		const { compositionId, scale, pan: _pan } = areaState;
		const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

		const layer = compositionState.layers[shapeLayerId];

		// Get all Shapes of the shape layer

		// Find content group
		const names = layer.properties.map(
			(propertyId) => compositionState.properties[propertyId].name,
		);
		const groupIndex = names.indexOf(PropertyGroupName.Content);
		const contentsGroupId = layer.properties[groupIndex];
		const contentsGroup = compositionState.properties[
			contentsGroupId
		] as CompositionPropertyGroup;

		// Find all shape groups within contents group
		const shapeGroupIds = contentsGroup.properties.filter((propertyId) => {
			const property = compositionState.properties[propertyId] as CompositionPropertyGroup;
			return property.name === PropertyGroupName.Shape;
		});

		const shapeIds: string[] = [];

		// Find all shapes within all the shapes
		for (const shapeGroupId of shapeGroupIds) {
			const shapeGroup = compositionState.properties[
				shapeGroupId
			] as CompositionPropertyGroup;

			for (const propertyId of shapeGroup.properties) {
				const property = compositionState.properties[propertyId] as CompositionProperty;

				if (property.name === PropertyName.ShapeLayer_Path) {
					shapeIds.push(property.value); // Value is shapeId
				}
			}
		}

		// All path ids found, now for the hit test

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

		const transform = map.transforms[shapeLayerId].transform[0];
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
						console.log("HIT CP");
					}
				}
			}

			// Check if any node was hit

			for (const nodeId of shape.nodes) {
				const node = shapeState.nodes[nodeId];
				const position = node.position;

				if (getDistance(mousePosition, translateToViewport(position)) < 5) {
					console.log("HIT NODE");
					return;
				}
			}
		}

		const shapeIdToNodeToEdges = shapeIds.reduce<{
			[shapeId: string]: { [nodeId: string]: string[] };
		}>((obj, shapeId) => {
			obj[shapeId] = getShapeNodeToEdges(shapeId, shapeState);
			return obj;
		}, {});

		// Nothing was hit
		//
		// Check if:
		//
		//		a) A single node is selected
		//		b) A single control point is selected
		// 		c) A single node and its associated control point are both selected
		//
		// The 'single' part applies to the combined selection of all paths. If two nodes
		// are selected in different paths then they cancel each other out.
		//
		// If a control point is selected, we treat it as if its associated node is selected.
		//
		// The node must be a filament (only has one full edge). If the node has two full
		// edges than we cannot extend the path it.
		//
		// If all of those conditions apply, we extend the path from the node
		const getNodeToContinue = (): [string, string | undefined] | undefined => {
			let selectedNode: string | undefined;
			let selectedControlPoint: string | undefined;

			for (const shapeId of shapeIds) {
				const shape = shapeState.shapes[shapeId];
				const selection = getShapeSelectionFromState(shapeId, shapeSelectionState);

				for (const edgeId of shape.edges) {
					const edge = shapeState.edges[edgeId];

					for (const cpId of [edge.cp0, edge.cp1]) {
						if (!cpId || !selection.controlPoints[cpId]) {
							continue;
						}

						if (selectedControlPoint) {
							// Two selected control points, break
							return undefined;
						}
						selectedControlPoint = cpId;
					}
				}

				for (const nodeId of shape.nodes) {
					if (!selection.nodes[nodeId]) {
						continue;
					}

					if (selectedNode) {
						// Two selected nodes points, break
						return undefined;
					}

					selectedNode = nodeId;
				}
			}

			if (selectedNode && selectedControlPoint) {
				const node = shapeState.nodes[selectedNode];
				const edgeIds = shapeIdToNodeToEdges[node.shapeId][node.id];

				for (const edgeId of edgeIds) {
					const edge = shapeState.edges[edgeId];

					if (!edge.n0) {
						if (selectedControlPoint === edge.cp1) {
							// partial edge's control point is the selected. Valid.
							return [selectedNode, selectedControlPoint];
						}

						// The node's partial edge control point is not the
						// selected control point. Invalid.
						return undefined;
					}

					if (!edge.n1) {
						if (selectedControlPoint === edge.cp0) {
							return [selectedNode, selectedControlPoint];
						}

						return undefined;
					}

					// Edge is full, continue
				}

				// Node has no partial edges where `selectedControlPoint` can show up. Invalid
				return undefined;
			}

			if (selectedControlPoint) {
				const cp = shapeState.controlPoints[selectedControlPoint]!;
				const edge = shapeState.edges[cp.edgeId];

				const nodeId = edge.cp0 !== cp.id ? edge.n1 : edge.n0;
				const otherNodeId = edge.cp0 !== cp.id ? edge.n0 : edge.n1;

				if (otherNodeId) {
					// Is control point of full edge. Invalid
					return undefined;
				}

				return [nodeId, selectedControlPoint];
			}

			if (selectedNode) {
				const node = shapeState.nodes[selectedNode];
				const edgeIds = shapeIdToNodeToEdges[node.shapeId][node.id];

				if (edgeIds.length < 2) {
					return [selectedNode, undefined];
				}
			}

			return undefined;
		};

		const toContinue = getNodeToContinue();

		if (!toContinue) {
			// Nothing was hit, clear the selection and create a new path on the shape layer.
			penToolHandlers.createNewPathOnShapeLayer(e, shapeLayerId, areaId, viewport);
			return;
		}

		const [nodeId, preferControlPoint] = toContinue;

		// Should continue node
		penToolHandlers.continueShape(e, nodeId, preferControlPoint, areaId, viewport);
	},

	continueShape: (
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

	createNewPathOnShapeLayer: (
		e: React.MouseEvent,
		layerId: string,
		areaId: string,
		viewport: Rect,
	) => {},

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
						n1: nodeId,
						cp1: e1cpId,
						n0: "",
						cp0: "",
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
						shapeActions.setEdgeControlPointPosition(
							e0Id,
							"cp0",
							moveVector.translated,
						),
						shapeActions.setEdgeControlPointPosition(
							e1Id,
							"cp1",
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
