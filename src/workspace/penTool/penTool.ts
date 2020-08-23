import { compositionActions } from "~/composition/compositionReducer";
import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import { CompositionPropertyGroup } from "~/composition/compositionTypes";
import { reduceLayerPropertiesAndGroups } from "~/composition/compositionUtils";
import { createShapeLayerShapeGroup } from "~/composition/path/shapeLayerPath";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { shapeActions } from "~/shape/shapeReducer";
import { shapeSelectionActions } from "~/shape/shapeSelectionReducer";
import {
	ShapeControlPoint,
	ShapeEdge,
	ShapeGraph,
	ShapeNode,
	ShapePath,
	ShapePathItem,
} from "~/shape/shapeTypes";
import {
	getLayerPathPropertyId,
	getPathTargetObject,
	getShapeContinuePathFrom,
	getShapeLayerDirectlySelectedPaths,
	getShapeLayerPathIds,
	getShapeLayerSelectedPathIds,
	getShapePathClosePathNodeId,
	getShapeSelectionFromState,
} from "~/shape/shapeUtils";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { LayerType, PropertyGroupName, PropertyName } from "~/types";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { createGenMapIdFn, createMapNumberId } from "~/util/mapUtils";
import { isVecInRect, rectOfTwoVecs } from "~/util/math";
import { constructPenToolContext, PenToolContext } from "~/workspace/penTool/penToolContext";
import { workspaceAreaActions } from "~/workspace/workspaceAreaReducer";
import { globalToWorkspacePosition } from "~/workspace/workspaceUtils";

export const penToolHandlers = {
	/**
	 * Move tool mouse down with a single selected shape layer
	 */
	moveToolMouseDown: (e: React.MouseEvent, layerId: string, areaId: string, viewport: Rect) => {
		// Create selection rect if moved, otherwise move selection up.
		const ctx = constructPenToolContext(e, layerId, areaId, viewport);

		const { shapeState, compositionState, compositionSelectionState } = getActionState();

		const selectedPathIds = getShapeLayerSelectedPathIds(
			layerId,
			compositionState,
			compositionSelectionState,
		);

		for (const pathId of selectedPathIds) {
			const { type, id } = getPathTargetObject(pathId, ctx);

			switch (type) {
				case "node": {
					penToolHandlers.nodeMouseDown(ctx, pathId, id, { fromMoveTool: true });
					return;
				}
				case "control_point": {
					penToolHandlers.controlPointMouseDown(ctx, id);
					return;
				}
			}
		}

		// Mouse did not hit any eligible target.
		//
		// Create a selection rect if the mouse moves, otherwise "lift" the
		// shape property selection up one level.

		const layer = compositionState.layers[layerId];
		const compositionId = layer.compositionId;
		const compositionSelection = getCompSelectionFromState(
			compositionId,
			compositionSelectionState,
		);

		let selectionRect: Rect | undefined;

		const additiveSelection = isKeyDown("Shift");

		mouseDownMoveAction(ctx.mousePosition.global, {
			translate: ctx.globalToNormal,
			keys: [],
			beforeMove: () => {},
			mouseMove: (params, { mousePosition, initialMousePosition }) => {
				selectionRect = rectOfTwoVecs(
					mousePosition.translated,
					initialMousePosition.translated,
				);
				params.dispatchToAreaState(
					ctx.areaId,
					workspaceAreaActions.setFields({ selectionRect }),
				);
			},
			mouseUp: (params, hasMoved) => {
				const pathIds = getShapeLayerSelectedPathIds(
					layerId,
					compositionState,
					compositionSelectionState,
				);

				if (hasMoved) {
					const rect = selectionRect!;
					const transform = ctx.layerTransform;
					const toDispatch: any[] = [];

					const directlySelected = getShapeLayerDirectlySelectedPaths(
						layerId,
						compositionState,
						compositionSelectionState,
					);

					const _addedToDirectSelection = new Set<string>();
					const addPathToDirectSelection = (pathId: string) => {
						if (_addedToDirectSelection.has(pathId)) {
							return;
						}

						const propertyId = getLayerPathPropertyId(
							layerId,
							pathId,
							compositionState,
						)!;
						toDispatch.push(
							compSelectionActions.addPropertyToSelection(compositionId, propertyId),
						);
						_addedToDirectSelection.add(pathId);
					};

					for (const pathId of pathIds) {
						const path = shapeState.paths[pathId];
						const { shapeId } = path;

						if (!additiveSelection) {
							toDispatch.push(shapeSelectionActions.clearShapeSelection(shapeId));
						}

						const toPos = (vec: Vec2) => {
							return vec
								.sub(transform.anchor)
								.apply((vec) => {
									if (transform.rotation) {
										return vec.rotate(transform.rotation);
									}
									return vec;
								})
								.apply((vec) => {
									if (transform.scale) {
										return vec.scale(transform.scale);
									}
									return vec;
								})
								.add(transform.translate);
						};

						for (const { nodeId, left, right } of path.items) {
							const node = shapeState.nodes[nodeId];

							if (isVecInRect(node.position.apply(toPos), rect)) {
								addPathToDirectSelection(pathId);
								toDispatch.push(
									shapeSelectionActions.addNodeToSelection(shapeId, nodeId),
								);
							}

							if (directlySelected.has(pathId)) {
								for (const part of [left, right]) {
									if (!part) {
										continue;
									}

									const cp = shapeState.controlPoints[part.controlPointId]!;

									if (
										isVecInRect(
											node.position.add(cp.position).apply(toPos),
											rect,
										)
									) {
										toDispatch.push(
											shapeSelectionActions.addControlPointToSelection(
												shapeId,
												cp.id,
											),
										);
									}
								}
							}
						}
					}

					params.dispatch(toDispatch);
					params.dispatchToAreaState(
						ctx.areaId,
						workspaceAreaActions.setFields({ selectionRect: null }),
					);
					params.submitAction("Modify selection");
					return;
				}

				// No object hit.
				//
				// Clear all shape selections and lift shape property selection up one level.

				const toDispatch: any[] = [];

				for (const pathId of pathIds) {
					const { shapeId } = shapeState.paths[pathId];
					toDispatch.push(shapeSelectionActions.clearShapeSelection(shapeId));
				}

				const shapeGroupIds = reduceLayerPropertiesAndGroups<string[]>(
					layerId,
					compositionState,
					(arr, property) => {
						if (property.name === PropertyGroupName.Shape) {
							arr.push(property.id);
						}
						return arr;
					},
					[],
				);

				for (const shapeGroupId of shapeGroupIds) {
					const group = compositionState.properties[
						shapeGroupId
					] as CompositionPropertyGroup;

					const propertyNames = group.properties.map(
						(id) => compositionState.properties[id].name,
					);

					const pathIndex = propertyNames.indexOf(PropertyName.ShapeLayer_Path);

					if (pathIndex === -1) {
						continue;
					}

					const pathPropertyId = group.properties[pathIndex];
					if (compositionSelection.properties[pathPropertyId]) {
						toDispatch.push(
							compSelectionActions.removePropertiesFromSelection(compositionId, [
								pathPropertyId,
							]),
							compSelectionActions.addPropertyToSelection(
								compositionId,
								shapeGroupId,
							),
						);
					} else {
						toDispatch.push(
							compSelectionActions.removePropertiesFromSelection(compositionId, [
								shapeGroupId,
							]),
						);
					}
				}

				params.dispatch(toDispatch);
				params.submitAction("Modify selection");
			},
		});
	},

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
			const ctx = constructPenToolContext(e, selectedShapeLayers[0], areaId, viewport);
			penToolHandlers.onShapeLayerMouseDown(ctx);
			return;
		}

		// Create new shape layer
		penToolHandlers.mouseDownCreateShapeLayer(e, areaId, viewport);
	},

	onShapeLayerMouseDown: (ctx: PenToolContext) => {
		const actionState = getActionState();
		const { compositionState, shapeState, shapeSelectionState } = actionState;

		const { layerId } = ctx;

		const pathIds = getShapeLayerPathIds(layerId, compositionState);

		for (const pathId of pathIds) {
			const { type, id } = getPathTargetObject(pathId, ctx);

			switch (type) {
				case "node": {
					penToolHandlers.nodeMouseDown(ctx, pathId, id, { fromMoveTool: false });
					return;
				}
				case "control_point": {
					penToolHandlers.controlPointMouseDown(ctx, id);
					return;
				}
			}
		}

		const continueFrom = getShapeContinuePathFrom(pathIds, shapeState, shapeSelectionState);

		if (!continueFrom) {
			// Nothing was hit, clear the selection and create a new path on the shape layer.
			penToolHandlers.createNewPathOnShapeLayer(ctx);
			return;
		}

		penToolHandlers.continuePath(ctx, continueFrom);
	},

	controlPointMouseDown: (ctx: PenToolContext, cpId: string) => {
		if (isKeyDown("Alt")) {
			penToolHandlers.removeControlPoint(ctx, cpId);
			return;
		}

		const { shapeState, shapeSelectionState } = ctx;

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

		mouseDownMoveAction(ctx.mousePosition.global, {
			keys: ["Shift"],
			translate: ctx.globalToNormal,
			beforeMove: (params) => {
				if (!additiveSelection && !selection.controlPoints[cpId]) {
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

	removeControlPoint: (ctx: PenToolContext, cpId: string) => {
		requestAction({ history: true }, (params) => {
			const toDispatch: any[] = [];

			const { shapeState } = ctx;
			const cp = shapeState.controlPoints[cpId]!;
			const edge = shapeState.edges[cp.edgeId];
			const which = edge.cp0 === cpId ? "cp0" : "cp1";

			toDispatch.push(
				shapeActions.removeControlPoint(cpId),
				shapeActions.setEdgeControlPointId(cp!.edgeId, which, ""),
			);

			// Find all paths that reference the control point
			const pathIds = Object.keys(shapeState.paths);

			for (const pathId of pathIds) {
				const path = shapeState.paths[pathId];
				if (path.shapeId !== edge.shapeId) {
					continue;
				}

				const firstItem = path.items[0];
				const lastItem = path.items[path.items.length - 1];

				for (let i = 0; i < path.items.length; i += 1) {
					const item = path.items[i];

					if (item.left && item.left.controlPointId === cp.id) {
						// Left control point of path is being removed.
						//
						// If we are removing the left cp of the first item and the path is
						// non-circular, we want to remove firstItem's left part entirely.
						if (
							i === 0 &&
							(lastItem.right
								? firstItem.left!.edgeId !== lastItem.right.edgeId
								: true)
						) {
							console.log({ firstItem, lastItem });
							// Path is non circular, remove the first item's left part.
							toDispatch.push(
								shapeActions.setPathItem(pathId, 0, {
									...firstItem,
									left: null,
								}),
							);
						} else {
							toDispatch.push(
								shapeActions.setPathItem(pathId, i, {
									...item,
									left: {
										...item.left,
										controlPointId: "",
									},
								}),
							);
						}
						break;
					}

					if (item.right && item.right.controlPointId === cp.id) {
						// Right control point of path is being removed.
						//
						// If we are removing the right cp of the last item and the path is
						// non-circular, we want to remove lastItem's right part entirely.
						if (
							i === path.items.length - 1 &&
							(firstItem.left
								? lastItem.right!.edgeId !== firstItem.left.edgeId
								: true)
						) {
							console.log({ firstItem, lastItem });
							// Path is non circular, remove the last item's right part.
							toDispatch.push(
								shapeActions.setPathItem(pathId, path.items.length - 1, {
									...firstItem,
									right: null,
								}),
							);
						} else {
							toDispatch.push(
								shapeActions.setPathItem(pathId, i, {
									...item,
									right: {
										...item.right,
										controlPointId: "",
									},
								}),
							);
						}
						break;
					}
				}
			}

			// Removing control point of stray edge. Remove edge entirely.
			if ((which === "cp0" && !edge.n1) || (which === "cp1" && !edge.n0)) {
				console.log("removing edge");
				toDispatch.push(shapeActions.removeEdge(edge.shapeId, cp.edgeId));
			}

			console.log(toDispatch);
			params.dispatch(toDispatch);
			params.submitAction("Remove control point");
		});
	},

	nodeMouseDown: (
		ctx: PenToolContext,
		pathId: string,
		nodeId: string,
		{ fromMoveTool }: { fromMoveTool: boolean },
	) => {
		const { layerId, shapeState, shapeSelectionState } = ctx;
		const { compositionState } = getActionState();

		const compositionId = compositionState.layers[layerId].compositionId;
		const node = shapeState.nodes[nodeId];
		const shapeId = node.shapeId;

		if (!fromMoveTool) {
			// Check if a single node is selected and the hit node is the close path node.
			const pathIds = getShapeLayerPathIds(layerId, compositionState);
			const continueFrom = getShapeContinuePathFrom(pathIds, shapeState, shapeSelectionState);

			if (continueFrom) {
				const closePathNodeId = getShapePathClosePathNodeId(continueFrom, shapeState);

				if (nodeId === closePathNodeId) {
					penToolHandlers.completePath(ctx, continueFrom);
					return;
				}
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

		mouseDownMoveAction(ctx.mousePosition.global, {
			keys: ["Shift"],
			translate: ctx.globalToNormal,
			beforeMove: (params) => {
				// Add path property to selection
				let pathPropertyId = getLayerPathPropertyId(layerId, pathId, compositionState);
				params.dispatch(
					compSelectionActions.addPropertyToSelection(compositionId, pathPropertyId!),
				);

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
		ctx: PenToolContext,
		continueFrom: { pathId: string; direction: "left" | "right" },
	) => {
		const { shapeState } = ctx;
		const { compositionState } = getActionState();
		const { direction, pathId } = continueFrom;

		const path = shapeState.paths[pathId];
		const dirLeft = direction === "left";

		let p0ItemIndex = dirLeft ? 0 : path.items.length - 1; // Will be modified when item1 is inserted
		let p0Item = path.items[p0ItemIndex];
		let p0Part1 = (dirLeft ? p0Item.left : p0Item.right)!;

		let p1ItemIndex = dirLeft ? 0 : path.items.length; // Assumes that item1 has already been inserted
		let p1Item!: ShapePathItem;
		let p1Part0!: ShapePathItem["left"];
		let p1Part1!: ShapePathItem["left"];

		let useEdgeId = p0Part1?.edgeId;
		const fromNodeId = p0Item.nodeId;

		const node = shapeState.nodes[fromNodeId];

		const { shapeId } = node;

		const newNodeId = createMapNumberId(shapeState.nodes);

		const createEdgeId = createGenMapIdFn(shapeState.edges);
		const createCpId = createGenMapIdFn(shapeState.controlPoints);

		let prevEdgeId = useEdgeId;
		let prevcp0Id!: string;
		let prevcp1Id!: string;

		let nextEdgeId!: string;
		let nextcp0Id!: string;

		mouseDownMoveAction(ctx.mousePosition.global, {
			translate: ctx.globalToNormal,
			keys: [],
			beforeMove: (params, { mousePosition }) => {
				const toDispatch: any[] = [];

				// Add path property to selection
				let pathPropertyId = getLayerPathPropertyId(ctx.layerId, pathId, compositionState);
				toDispatch.push(
					compSelectionActions.addPropertyToSelection(ctx.compositionId, pathPropertyId!),
				);

				const newNode: ShapeNode = {
					id: newNodeId,
					position: mousePosition.translated,
					shapeId,
				};

				toDispatch.push(shapeActions.addNode(shapeId, newNode));

				// Create/modify the part of item 0 that references the edge between the currently
				// selected node and the new node.
				if (!p0Part1) {
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
					p0Part1 = {
						edgeId: prevEdgeId,
						controlPointId: "",
					};
					p0Item = {
						...p0Item,
						[direction]: p0Part1,
					};
					toDispatch.push(shapeActions.setPathItem(pathId, p0ItemIndex, p0Item));
				} else {
					const edge = shapeState.edges[p0Part1.edgeId];
					toDispatch.push(
						shapeActions.setEdgeNodeId(
							p0Part1.edgeId,
							edge.n0 ? "n1" : "n0",
							newNodeId,
						),
					);
				}

				// Create path item for the new node
				p1Part0 = {
					controlPointId: "",
					edgeId: prevEdgeId!,
				};
				p1Item = {
					nodeId: newNodeId,
					left: dirLeft ? null : p1Part0,
					right: dirLeft ? p1Part0 : null,
				};
				toDispatch.push(shapeActions.insertPathItem(pathId, p1Item, direction));

				// If we're inserting item1 before item0, increment itemIndex
				if (direction === "left") {
					p0ItemIndex++;
				}

				// Select newly created node
				toDispatch.push(
					shapeSelectionActions.clearShapeSelection(shapeId),
					shapeSelectionActions.addNodeToSelection(shapeId, newNodeId),
				);

				params.dispatch(toDispatch);
			},
			mouseMove: (params, { firstMove, moveVector }) => {
				const toDispatch: any[] = [];

				const prevCpPos = moveVector.translated.scale(-1);
				const nextCpPos = moveVector.translated;

				if (firstMove) {
					if (p0Part1.controlPointId) {
						// part0 had a control point, we only need to create a control
						// point for part1

						const newCpId = createCpId();
						const which = "cp1";
						prevcp0Id = dirLeft ? p0Part1.controlPointId : newCpId;

						const cp: ShapeControlPoint = {
							id: newCpId,
							edgeId: p0Part1.edgeId,
							position: moveVector.translated,
						};
						p1Part0 = {
							edgeId: p0Part1.edgeId,
							controlPointId: cp.id,
						};
						p1Item = {
							nodeId: newNodeId,
							left: dirLeft ? null : p1Part0,
							right: dirLeft ? p1Part0 : null,
						};

						toDispatch.push(
							shapeActions.setControlPoint(cp),
							shapeActions.setEdgeControlPointId(p0Part1.edgeId, which, newCpId),
							shapeActions.setPathItem(pathId, p1ItemIndex, p1Item),
						);
					} else {
						// No control point for part0, we are creating control points
						// for part0 and part1

						prevEdgeId = createEdgeId();
						// prevcp0Id = createCpId();
						prevcp1Id = createCpId();

						const edge: ShapeEdge = {
							id: prevEdgeId,
							shapeId,
							n0: fromNodeId,
							cp0: prevcp0Id,
							n1: newNodeId,
							cp1: prevcp1Id,
						};
						const cp1: ShapeControlPoint = {
							id: prevcp1Id,
							edgeId: prevEdgeId,
							position: moveVector.translated.scale(-1),
						};
						p0Part1 = {
							edgeId: edge.id,
							controlPointId: "",
						};
						p0Item = {
							...p0Item,
							[direction]: p0Part1,
						};
						p1Part0 = {
							edgeId: edge.id,
							controlPointId: cp1.id,
						};
						p1Item = {
							nodeId: newNodeId,
							left: dirLeft ? null : p1Part0,
							right: dirLeft ? p1Part0 : null,
						};

						toDispatch.push(
							shapeActions.addEdge(shapeId, edge),
							shapeActions.setControlPoint(cp1),
							shapeActions.setPathItem(pathId, p0ItemIndex, p0Item),
							shapeActions.setPathItem(pathId, p1ItemIndex, p1Item),
						);
					}

					// Create p1Items's part 1
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
					p1Part1 = {
						edgeId: nextEdgeId,
						controlPointId: nextcp0Id,
					};
					p1Item = {
						nodeId: newNodeId,
						left: dirLeft ? p1Part1 : p1Part0,
						right: dirLeft ? p1Part0 : p1Part1,
					};

					toDispatch.push(
						shapeActions.addEdge(shapeId, nextEdge),
						shapeActions.setControlPoint(nextcp0),
						shapeActions.setPathItem(pathId, p1ItemIndex, p1Item),
						shapeSelectionActions.addControlPointToSelection(shapeId, nextcp0Id),
					);
					params.dispatch(toDispatch);
					return;
				}

				const x0 = p1Part0!.controlPointId;
				const x1 = p1Part1!.controlPointId;

				if (x0) {
					toDispatch.push(shapeActions.setControlPointPosition(x0, prevCpPos));
				}

				toDispatch.push(shapeActions.setControlPointPosition(x1, nextCpPos));

				params.dispatch(toDispatch);
			},
			mouseUp: (params) => {
				params.submitAction("Do a thing");
			},
		});
	},

	completePath: (
		ctx: PenToolContext,
		continueFrom: { pathId: string; direction: "left" | "right" },
	) => {
		const { shapeState, compositionState } = getActionState();

		const { pathId, direction } = continueFrom;
		const path = shapeState.paths[pathId];
		const { shapeId } = path;
		const dirLeft = direction === "left";

		let edgeId: string;

		let item0Index = 0;
		let item0 = path.items[item0Index];

		let item1Index = path.items.length - 1;
		let item1 = path.items[item1Index];

		let rcp0Id: string;
		let rcp1Id: string;

		mouseDownMoveAction(ctx.mousePosition.global, {
			translate: ctx.globalToNormal,
			keys: [],
			beforeMove: (params) => {
				const toDispatch: any[] = [];

				// Add path property to selection
				let pathPropertyId = getLayerPathPropertyId(ctx.layerId, pathId, compositionState);
				toDispatch.push(
					compSelectionActions.addPropertyToSelection(ctx.compositionId, pathPropertyId!),
				);

				edgeId = item0.left?.edgeId || item1.right?.edgeId || "";
				let cp0Id = item1.right?.controlPointId || "";
				let cp1Id = item0.left?.controlPointId || "";

				if (!edgeId) {
					edgeId = createMapNumberId(shapeState.edges);
				}

				if (item0.left) {
					if (item0.left.edgeId !== edgeId) {
						const deleteEdgeId = item0.left.edgeId;
						toDispatch.push(shapeActions.removeEdge(shapeId, deleteEdgeId));

						const cp1 = shapeState.controlPoints[cp1Id];
						if (cp1) {
							toDispatch.push(
								shapeActions.setControlPoint({
									...cp1,
									edgeId,
								}),
							);
						}
					}

					item0 = {
						...item0,
						left: {
							edgeId,
							controlPointId: cp1Id,
						},
					};
					toDispatch.push(shapeActions.setPathItem(pathId, item0Index, item0));
				}

				if (item1.right) {
					if (item1.right.edgeId !== edgeId) {
						const deleteEdgeId = item1.right.edgeId;
						toDispatch.push(shapeActions.removeEdge(shapeId, deleteEdgeId));

						const cp0 = shapeState.controlPoints[cp0Id];
						if (cp0) {
							toDispatch.push(
								shapeActions.setControlPoint({
									...cp0,
									edgeId,
								}),
							);
						}
					}

					item1 = {
						...item1,
						right: {
							edgeId,
							controlPointId: cp0Id,
						},
					};
					toDispatch.push(shapeActions.setPathItem(pathId, item1Index, item1));
				}

				const edge: ShapeEdge = {
					id: edgeId,
					shapeId,
					cp0: cp0Id || "",
					cp1: cp1Id || "",
					n0: item1.nodeId,
					n1: item0.nodeId,
				};
				toDispatch.push(shapeActions.addEdge(shapeId, edge));

				params.dispatch(toDispatch);
			},
			mouseMove: (params, { firstMove, moveVector }) => {
				const createCpId = createGenMapIdFn(getActionState().shapeState.controlPoints);

				const item = dirLeft ? item1 : item0;
				const itemIndex = dirLeft ? item1Index : item0Index;
				const left = dirLeft ? "left" : "right";
				const right = dirLeft ? "right" : "left";
				const cp0 = dirLeft ? "cp1" : "cp0";
				const cp1 = dirLeft ? "cp0" : "cp1";

				if (firstMove) {
					rcp0Id = item[left]?.controlPointId || "";
					rcp1Id = item[right]?.controlPointId || "";
				}

				if (!rcp0Id) {
					rcp0Id = createCpId();
					const cp: ShapeControlPoint = {
						id: rcp0Id,
						edgeId,
						position: moveVector.translated,
					};
					params.dispatch(
						shapeActions.setControlPoint(cp),
						shapeActions.setEdgeControlPointId(item[left]!.edgeId, cp0, rcp0Id),
						shapeActions.setPathItemControlPointId(pathId, left, itemIndex, rcp0Id),
					);
				}
				if (!rcp1Id) {
					rcp1Id = createCpId();
					const cp: ShapeControlPoint = {
						id: rcp1Id,
						edgeId,
						position: moveVector.translated.scale(-1),
					};
					params.dispatch(
						shapeActions.setControlPoint(cp),
						shapeActions.setEdgeControlPointId(item[right]!.edgeId, cp1, rcp1Id),
						shapeActions.setPathItemControlPointId(pathId, right, itemIndex, rcp1Id),
					);
				}

				params.dispatch(
					shapeActions.setControlPointPosition(rcp0Id, moveVector.translated),
					shapeActions.setControlPointPosition(rcp1Id, moveVector.translated.scale(-1)),
				);
			},
			mouseUp: (params) => {
				params.submitAction("Close path");
			},
		});
	},

	createNewPathOnShapeLayer: (ctx: PenToolContext) => {
		const { compositionState, shapeState } = getActionState();
		const { layerId, compositionId } = ctx;

		const layer = compositionState.layers[layerId];

		const shapeId = createMapNumberId(shapeState.shapes);
		const pathId = createMapNumberId(shapeState.paths);
		const nodeId = createMapNumberId(shapeState.nodes);

		const createEdgeId = createGenMapIdFn(shapeState.edges);
		const e0Id = createEdgeId();
		const e1Id = createEdgeId();

		const createCpId = createGenMapIdFn(shapeState.controlPoints);
		const e0cpId = createCpId();
		const e1cpId = createCpId();

		mouseDownMoveAction(ctx.mousePosition.global, {
			translate: ctx.globalToNormal,
			keys: [],
			beforeMove: (params, { mousePosition }) => {
				// Clear selection and select layer
				const pathIds = getShapeLayerPathIds(layerId, compositionState);
				params.dispatch(
					compSelectionActions.clearCompositionSelection(compositionId),
					compSelectionActions.addLayerToSelection(compositionId, layerId),
					...pathIds.map((pathId) => {
						const { shapeId } = shapeState.paths[pathId];
						const shape = shapeState.shapes[shapeId];
						return shapeSelectionActions.clearShapeSelection(shape.id);
					}),
				);

				// Create and select shape + path
				const shape: ShapeGraph = {
					id: shapeId,
					nodes: [],
					edges: [],
					moveVector: Vec2.new(0, 0),
				};
				const path: ShapePath = {
					id: shapeId,
					shapeId,
					items: [
						{
							nodeId,
							left: null,
							right: null,
						},
					],
				};
				const node: ShapeNode = {
					id: nodeId,
					shapeId,
					position: mousePosition.translated,
				};
				params.dispatch(
					shapeActions.setShape(shape),
					shapeActions.setPath(path),
					shapeActions.addNode(shapeId, node),
					shapeSelectionActions.addNodeToSelection(shape.id, node.id),
				);

				// Find content group
				const names = layer.properties.map(
					(propertyId) => compositionState.properties[propertyId].name,
				);
				const groupIndex = names.indexOf(PropertyGroupName.Content);
				const contentsGroupId = layer.properties[groupIndex];

				// Create Shape property group
				const { propertyId, pathPropertyId, propertiesToAdd } = createShapeLayerShapeGroup(
					pathId,
					{
						compositionId,
						layerId,
						createId: createGenMapIdFn(compositionState.properties),
					},
				);

				// Add Shape property to contents group and select the Path of the Shape group
				params.dispatch(
					compositionActions.addPropertyToPropertyGroup(
						contentsGroupId,
						propertyId,
						propertiesToAdd,
					),
					compSelectionActions.addPropertyToSelection(compositionId, propertyId),
					compSelectionActions.addPropertyToSelection(compositionId, pathPropertyId),
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
						shapeActions.setPathItem(pathId, 0, {
							nodeId,
							left: {
								edgeId: e1Id,
								controlPointId: e1cpId,
							},
							right: {
								edgeId: e0Id,
								controlPointId: e0cpId,
							},
						}),
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

	mouseDownCreateShapeLayer: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		const { compositionId, pan, scale } = getAreaActionState<AreaType.Workspace>(areaId);

		const layerId = createMapNumberId(getActionState().compositionState.layers);

		const initialShapeState = getActionState().shapeState;

		const shapeId = createMapNumberId(initialShapeState.shapes);
		const pathId = createMapNumberId(initialShapeState.paths);
		const nodeId = createMapNumberId(initialShapeState.nodes);

		const createEdgeId = createGenMapIdFn(initialShapeState.edges);
		const e0Id = createEdgeId();
		const e1Id = createEdgeId();

		const createCpId = createGenMapIdFn(initialShapeState.controlPoints);
		const e0cpId = createCpId();
		const e1cpId = createCpId();

		let ctx: PenToolContext;

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

				// Layer has been created, context can be constructed
				ctx = constructPenToolContext(e, layerId, areaId, viewport);

				// Create and select shape + path
				const shape: ShapeGraph = {
					id: shapeId,
					nodes: [],
					edges: [],
					moveVector: Vec2.new(0, 0),
				};
				const path: ShapePath = {
					id: shapeId,
					shapeId,
					items: [
						{
							nodeId,
							left: null,
							right: null,
						},
					],
				};
				const node: ShapeNode = {
					id: nodeId,
					shapeId,
					position: mousePosition.translated,
				};
				params.dispatch(
					shapeActions.setShape(shape),
					shapeActions.setPath(path),
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
				const { propertyId, pathPropertyId, propertiesToAdd } = createShapeLayerShapeGroup(
					pathId,
					{
						compositionId,
						layerId,
						createId: createGenMapIdFn(compositionState.properties),
					},
				);

				// Add Shape property to contents group and select the Path of the Shape group
				params.dispatch(
					compositionActions.addPropertyToPropertyGroup(
						contentsGroupId,
						propertyId,
						propertiesToAdd,
					),
					compSelectionActions.addPropertyToSelection(compositionId, propertyId),
					compSelectionActions.addPropertyToSelection(compositionId, pathPropertyId),
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
						shapeActions.setPathItem(pathId, 0, {
							nodeId,
							left: {
								edgeId: e1Id,
								controlPointId: e1cpId,
							},
							right: {
								edgeId: e0Id,
								controlPointId: e0cpId,
							},
						}),
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
