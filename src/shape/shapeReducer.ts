import { ActionType, createAction, getType } from "typesafe-actions";
import {
	ShapeControlPoint,
	ShapeEdge,
	ShapeGraph,
	ShapeNode,
	ShapePath,
	ShapePathItem,
	ShapeSelection,
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
	setShape: createAction("shape/SET", (action) => {
		return (shape: ShapeGraph) => action({ shape });
	}),

	setPath: createAction("shape/SET_PATH", (action) => {
		return (path: ShapePath) => action({ path });
	}),

	setPathItem: createAction("shape/SET_PATH_ITEM", (action) => {
		return (pathId: string, itemIndex: number, item: ShapePathItem) =>
			action({ pathId, itemIndex, item });
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
		return (pathId: string, item: ShapePathItem, direction: "left" | "right") =>
			action({ pathId, item, direction });
	}),

	applySelectionRect: createAction("shape/APPLY_SELECTION_RECT", (action) => {
		return (shapeId: string, rect: Rect) => action({ shapeId, rect });
	}),

	setMoveVector: createAction("shape/SET_MOVE_VECTOR", (action) => {
		return (shapeId: string, moveVector: Vec2) => action({ shapeId, moveVector });
	}),

	applyMoveVector: createAction("shape/APPLY_MOVE_VECTOR", (action) => {
		return (shapeId: string, selection: ShapeSelection) => action({ shapeId, selection });
	}),

	addEdge: createAction("shape/ADD_EDGE", (action) => {
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
		case getType(shapeActions.setShape): {
			const { shape } = action.payload;
			return { ...state, shapes: { ...state.shapes, [shape.id]: shape } };
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

		case getType(shapeActions.insertPathItem): {
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

		case getType(shapeActions.setMoveVector): {
			const { shapeId, moveVector } = action.payload;
			return {
				...state,
				shapes: modifyItemsInMap(state.shapes, shapeId, (shape) => ({
					...shape,
					moveVector,
				})),
			};
		}

		case getType(shapeActions.applyMoveVector): {
			const { shapeId, selection } = action.payload;

			/**
			 * @todo Apply the move vector
			 */
			const { moveVector } = state.shapes[shapeId];

			const selectedNodeIds = Object.keys(selection.nodes);

			const newState: ShapeState = {
				...state,
				shapes: modifyItemsInMap(state.shapes, shapeId, (shape) => ({
					...shape,
					moveVector: Vec2.new(0, 0),
				})),
				nodes: modifyItemsInMap(state.nodes, selectedNodeIds, (node) => ({
					...node,
					position: node.position.add(moveVector),
				})),
				controlPoints: { ...state.controlPoints },
			};

			const applyMoveVectorToCp = (cpId: string) => {
				const cp = state.controlPoints[cpId]!;
				newState.controlPoints[cpId] = {
					...cp,
					position: cp?.position.add(moveVector),
				};
			};

			const edgeIds = state.shapes[shapeId].edges;
			for (const edgeId of edgeIds) {
				const edge = newState.edges[edgeId];

				if (selection.controlPoints[edge.cp0] && !selection.nodes[edge.n0]) {
					applyMoveVectorToCp(edge.cp0);
				}

				if (selection.controlPoints[edge.cp1] && !selection.nodes[edge.n1]) {
					applyMoveVectorToCp(edge.cp1);
				}
			}

			return newState;
		}

		case getType(shapeActions.addEdge): {
			const { shapeId, edge } = action.payload;
			return {
				...state,
				shapes: modifyItemsInMap(state.shapes, shapeId, (shape) => ({
					...shape,
					edges: [...shape.edges, edge.id],
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

		default:
			return state;
	}
};
