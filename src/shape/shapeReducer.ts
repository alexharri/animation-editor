import { ActionType, createAction, getType } from "typesafe-actions";
import {
	ShapeControlPoint,
	ShapeEdge,
	ShapeGraph,
	ShapeNode,
	ShapePath,
	ShapePathItem,
} from "~/shape/shapeTypes";
import { addListToMap, modifyItemsInMap, removeKeysFromMap } from "~/util/mapUtils";

export interface ShapeState {
	shapes: {
		[shapeId: string]: ShapeGraph;
	};
	nodes: {
		[nodeId: string]: ShapeNode;
	};
	edges: {
		[edgeId: string]: ShapeEdge;
	};
	controlPoints: Partial<{
		[controlPointId: string]: ShapeControlPoint;
	}>;
	paths: {
		[pathId: string]: ShapePath;
	};
}

export const shapeActions = {
	setState: createAction("shape/SET_STATE", (action) => {
		return (state: ShapeState) => action({ state });
	}),

	setShape: createAction("shape/SET", (action) => {
		return (shape: ShapeGraph) => action({ shape });
	}),

	removeShape: createAction("shape/REMOVE_SHAPE", (action) => {
		return (shapeId: string) => action({ shapeId });
	}),

	setPath: createAction("shape/SET_PATH", (action) => {
		return (path: ShapePath) => action({ path });
	}),

	setPathItem: createAction("shape/SET_PATH_ITEM", (action) => {
		return (pathId: string, itemIndex: number, item: ShapePathItem) =>
			action({ pathId, itemIndex, item });
	}),

	setPathItemPart: createAction("shape/SET_PATH_ITEM_PART", (action) => {
		return (
			pathId: string,
			itemIndex: number,
			which: "left" | "right",
			part: ShapePathItem["right"],
		) => action({ pathId, itemIndex, which, part });
	}),

	removePath: createAction("shape/REMOVE_PATH", (action) => {
		return (pathId: string) => action({ pathId });
	}),

	removePathItem: createAction("shape/REMOVE_PATH_ITEM", (action) => {
		return (pathId: string, itemIndex: number) => action({ pathId, itemIndex });
	}),

	setPathItemControlPointId: createAction("shape/SET_PATH_ITEM_CP_ID", (action) => {
		return (
			pathId: string,
			which: "left" | "right",
			itemIndex: number,
			controlPointId: string,
		) => action({ pathId, itemIndex, which, controlPointId });
	}),

	insertPathItem: createAction("shape/INSERT_PATH_ITEM", (action) => {
		return (pathId: string, insertIndex: number, item: ShapePathItem) =>
			action({ pathId, insertIndex, item });
	}),

	appendPathItem: createAction("shape/APPEND_PATH_ITEM", (action) => {
		return (pathId: string, item: ShapePathItem, direction: "left" | "right") =>
			action({ pathId, item, direction });
	}),

	applySelectionRect: createAction("shape/APPLY_SELECTION_RECT", (action) => {
		return (shapeId: string, rect: Rect) => action({ shapeId, rect });
	}),

	toggleControlPointReflect: createAction("shape/TOGGLE_CP_REFLECT", (action) => {
		return (shapeId: string, cpId: string) => action({ shapeId, cpId });
	}),

	setEdge: createAction("shape/ADD_EDGE", (action) => {
		return (shapeId: string, edge: ShapeEdge) => action({ shapeId, edge });
	}),

	setEdgeNodeId: createAction("shape/SET_EDGE_NODE_ID", (action) => {
		return (edgeId: string, which: "n0" | "n1", nodeId: string) =>
			action({ edgeId, which, nodeId });
	}),

	setEdgeControlPointId: createAction("shape/SET_EDGE_CP_ID", (action) => {
		return (edgeId: string, which: "cp0" | "cp1", cpId: string) =>
			action({ edgeId, which, cpId });
	}),

	setEdgeControlPointPosition: createAction("shape/SET_EDGE_CP_POS", (action) => {
		return (edgeId: string, which: "cp0" | "cp1", position: Vec2) =>
			action({ edgeId, which, position });
	}),

	removeEdge: createAction("shape/REMOVE_EDGE", (action) => {
		return (shapeId: string, edgeId: string) => action({ shapeId, edgeId });
	}),

	addNode: createAction("shape/ADD_NODE", (action) => {
		return (shapeId: string, node: ShapeNode) => action({ shapeId, node });
	}),

	removeNode: createAction("shape/REMOVE_NODE", (action) => {
		return (shapeId: string, nodeId: string) => action({ shapeId, nodeId });
	}),

	setControlPoint: createAction("shape/ADD_CP", (action) => {
		return (cp: ShapeControlPoint) => action({ cp });
	}),

	setControlPointPosition: createAction("shape/SET_CP_POSITION", (action) => {
		return (cpId: string, position: Vec2) => action({ cpId, position });
	}),

	removeControlPoint: createAction("shape/REMOVE_CP", (action) => {
		return (cpId: string) => action({ cpId });
	}),

	addObjects: createAction("shape/ADD_OBJECTS", (action) => {
		return (fields: Partial<ShapeState>) => action({ fields });
	}),
};

type ShapeAction = ActionType<typeof shapeActions>;

export const initialShapeState: ShapeState = {
	shapes: {},
	edges: {},
	nodes: {},
	controlPoints: {},
	paths: {},
};

export const shapeReducer = (
	state: ShapeState = initialShapeState,
	action: ShapeAction,
): ShapeState => {
	switch (action.type) {
		case getType(shapeActions.setState): {
			return action.payload.state;
		}

		case getType(shapeActions.setShape): {
			const { shape } = action.payload;
			return { ...state, shapes: { ...state.shapes, [shape.id]: shape } };
		}

		case getType(shapeActions.removeShape): {
			const { shapeId } = action.payload;

			const controlPointIds: string[] = [];

			const shape = state.shapes[shapeId];
			for (const edgeId of shape.edges) {
				const edge = state.edges[edgeId];
				controlPointIds.push(edge.cp0, edge.cp1);
			}

			return {
				...state,
				controlPoints: removeKeysFromMap(state.controlPoints, controlPointIds),
				edges: removeKeysFromMap(state.edges, shape.edges),
				nodes: removeKeysFromMap(state.nodes, shape.nodes),
				shapes: removeKeysFromMap(state.shapes, [shapeId]),
			};
		}

		case getType(shapeActions.setPath): {
			const { path } = action.payload;
			return { ...state, paths: { ...state.paths, [path.id]: path } };
		}

		case getType(shapeActions.setPathItem): {
			const { pathId, item: newItem, itemIndex } = action.payload;
			return {
				...state,
				paths: modifyItemsInMap(state.paths, pathId, (path) => {
					return {
						...path,
						items: path.items.map((item, i) => (i === itemIndex ? newItem : item)),
					};
				}),
			};
		}

		case getType(shapeActions.insertPathItem): {
			const { pathId, item, insertIndex } = action.payload;
			return {
				...state,
				paths: modifyItemsInMap(state.paths, pathId, (path) => {
					const items = [...path.items];
					items.splice(insertIndex, 0, item);
					return { ...path, items };
				}),
			};
		}

		case getType(shapeActions.setPathItemPart): {
			const { pathId, itemIndex, which, part } = action.payload;
			return {
				...state,
				paths: modifyItemsInMap(state.paths, pathId, (path) => {
					return {
						...path,
						items: path.items.map((item, i) =>
							i === itemIndex
								? {
										...item,
										[which]: part,
								  }
								: item,
						),
					};
				}),
			};
		}

		case getType(shapeActions.removePathItem): {
			const { pathId, itemIndex } = action.payload;
			return {
				...state,
				paths: modifyItemsInMap(state.paths, pathId, (path) => {
					const items = [...path.items];
					items.splice(itemIndex, 1);
					return { ...path, items };
				}),
			};
		}

		case getType(shapeActions.removePath): {
			const { pathId } = action.payload;
			return {
				...state,
				paths: removeKeysFromMap(state.paths, [pathId]),
			};
		}

		case getType(shapeActions.setPathItemControlPointId): {
			const { pathId, itemIndex, which, controlPointId } = action.payload;
			return {
				...state,
				paths: modifyItemsInMap(state.paths, pathId, (path) => {
					return {
						...path,
						items: path.items.map((item, i) => {
							if (i !== itemIndex) {
								return item;
							}

							const newItem = { ...item };

							if (which === "left") {
								newItem.left = {
									...newItem.left!,
									controlPointId,
								};
							} else {
								newItem.right = {
									...newItem.right!,
									controlPointId,
								};
							}

							return newItem;
						}),
					};
				}),
			};
		}

		case getType(shapeActions.appendPathItem): {
			const { pathId, item, direction } = action.payload;

			return {
				...state,
				paths: modifyItemsInMap(state.paths, pathId, (path) => {
					const items = [...path.items];

					if (direction === "left") {
						items.splice(0, 0, item);
					} else {
						items.push(item);
					}

					return { ...path, items };
				}),
			};
		}

		case getType(shapeActions.applySelectionRect): {
			throw new Error("Not implemented");
		}

		case getType(shapeActions.toggleControlPointReflect): {
			const { shapeId, cpId } = action.payload;

			const newState: ShapeState = {
				...state,
				paths: { ...state.paths },
			};

			const pathIds = Object.keys(state.paths).filter(
				(pathId) => state.paths[pathId].shapeId === shapeId,
			);
			for (const pathId of pathIds) {
				let path = newState.paths[pathId];

				for (let i = 0; i < path.items.length; i++) {
					const item = path.items[i];
					if (!item.left?.controlPointId || !item.right?.controlPointId) {
						continue;
					}

					const cpl = item.left.controlPointId;
					const cpr = item.right.controlPointId;

					if (cpl === cpId || cpr === cpId) {
						// Both control points were moved. Control points are no longer
						// being reflected
						path = {
							...path,
							items: path.items.map((item, index) => {
								if (i !== index) {
									return item;
								}
								return {
									...item,
									reflectControlPoints: !item.reflectControlPoints,
								};
							}),
						};
						newState.paths[pathId] = path;
					}
				}
			}

			return newState;
		}

		case getType(shapeActions.setEdge): {
			const { shapeId, edge } = action.payload;
			return {
				...state,
				shapes: modifyItemsInMap(state.shapes, shapeId, (shape) => ({
					...shape,
					edges: [...new Set([...shape.edges, edge.id])],
				})),
				edges: addListToMap(state.edges, [edge], "id"),
			};
		}

		case getType(shapeActions.setEdgeControlPointPosition): {
			const { edgeId, which, position } = action.payload;

			const edge = state.edges[edgeId];
			const cpId = edge[which];

			return {
				...state,
				controlPoints: modifyItemsInMap(state.controlPoints, cpId, (cp) => ({
					...cp!,
					position,
				})),
			};
		}

		case getType(shapeActions.setEdgeNodeId): {
			const { edgeId, which, nodeId } = action.payload;

			return {
				...state,
				edges: modifyItemsInMap(state.edges, edgeId, (edge) => ({
					...edge,
					[which]: nodeId,
				})),
			};
		}

		case getType(shapeActions.setEdgeControlPointId): {
			const { edgeId, which, cpId } = action.payload;

			return {
				...state,
				edges: modifyItemsInMap(state.edges, edgeId, (edge) => ({
					...edge,
					[which]: cpId,
				})),
			};
		}

		case getType(shapeActions.removeEdge): {
			const { shapeId, edgeId } = action.payload;
			return {
				...state,
				shapes: modifyItemsInMap(state.shapes, shapeId, (shape) => ({
					...shape,
					edges: shape.edges.filter((id) => id !== edgeId),
				})),
				edges: removeKeysFromMap(state.edges, [edgeId]),
			};
		}

		case getType(shapeActions.addNode): {
			const { shapeId, node } = action.payload;
			return {
				...state,
				shapes: modifyItemsInMap(state.shapes, shapeId, (shape) => ({
					...shape,
					nodes: [...shape.nodes, node.id],
				})),
				nodes: addListToMap(state.nodes, [node], "id"),
			};
		}

		case getType(shapeActions.removeNode): {
			const { shapeId, nodeId } = action.payload;
			return {
				...state,
				shapes: modifyItemsInMap(state.shapes, shapeId, (shape) => ({
					...shape,
					nodes: shape.nodes.filter((id) => id !== nodeId),
				})),
				nodes: removeKeysFromMap(state.nodes, [nodeId]),
			};
		}

		case getType(shapeActions.setControlPoint): {
			const { cp } = action.payload;
			return {
				...state,
				controlPoints: addListToMap(state.controlPoints, [cp], "id"),
			};
		}

		case getType(shapeActions.setControlPointPosition): {
			const { cpId, position } = action.payload;
			return {
				...state,
				controlPoints: modifyItemsInMap(state.controlPoints, cpId, (cp) => ({
					...cp!,
					position,
				})),
			};
		}

		case getType(shapeActions.removeControlPoint): {
			const { cpId } = action.payload;
			return {
				...state,
				controlPoints: removeKeysFromMap(state.controlPoints, [cpId]),
			};
		}

		case getType(shapeActions.addObjects): {
			const { fields } = action.payload;
			return {
				shapes: { ...state.shapes, ...(fields.shapes || {}) },
				edges: { ...state.edges, ...(fields.edges || {}) },
				nodes: { ...state.nodes, ...(fields.nodes || {}) },
				controlPoints: { ...state.controlPoints, ...(fields.controlPoints || {}) },
				paths: { ...state.paths, ...(fields.paths || {}) },
			};
		}

		default:
			return state;
	}
};
