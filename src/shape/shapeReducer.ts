import { ActionType, createAction, getType } from "typesafe-actions";
import { ShapeControlPoint, ShapeEdge, ShapeGraph, ShapeNode } from "~/shape/shapeTypes";
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
}

export const shapeActions = {
	setShape: createAction("shape/SET", (action) => {
		return (shape: ShapeGraph) => action({ shape });
	}),

	applySelectionRect: createAction("shape/APPLY_SELECTION_RECT", (action) => {
		return (shapeId: string, rect: Rect) => action({ shapeId, rect });
	}),

	applyMoveVector: createAction("shape/APPLY_MOVE_VECTOR", (action) => {
		return (shapeId: string) => action({ shapeId });
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
};

export const shapeReducer = (
	state: ShapeState = initialShapeState,
	action: ShapeAction,
): ShapeState => {
	switch (action.type) {
		case getType(shapeActions.setShape): {
			const { shape } = action.payload;
			return {
				...state,
				shapes: {
					...state.shapes,
					[shape.id]: shape,
				},
			};
		}

		case getType(shapeActions.applySelectionRect): {
			throw new Error("Not implemented");
		}

		case getType(shapeActions.applyMoveVector): {
			throw new Error("Not implemented");
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
