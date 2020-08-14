import { ActionType, createAction, getType } from "typesafe-actions";
import { ShapeSelection } from "~/shape/shapeTypes";
import { removeKeysFromMap } from "~/util/mapUtils";

export const shapeSelectionActions = {
	addNodeToSelection: createAction("sh_sel/ADD_NODE_TO_SELECTION", (action) => {
		return (shapeId: string, nodeId: string) => action({ shapeId, nodeId });
	}),

	toggleNodeSelection: createAction("sh_sel/TOGGLE_NODE_SELECTED", (action) => {
		return (shapeId: string, nodeId: string) => action({ shapeId, nodeId });
	}),

	addEdgeToSelection: createAction("sh_sel/ADD_EDGE_TO_SELECTION", (action) => {
		return (shapeId: string, edgeId: string) => action({ shapeId, edgeId });
	}),

	toggleEdgeSelection: createAction("sh_sel/TOGGLE_EDGE_SELECTED", (action) => {
		return (shapeId: string, edgeId: string) => action({ shapeId, edgeId });
	}),

	addControlPointToSelection: createAction("sh_sel/ADD_CP_TO_SELECTION", (action) => {
		return (shapeId: string, cpId: string) => action({ shapeId, cpId });
	}),

	toggleControlPointSelection: createAction("sh_sel/TOGGLE_CP_SELECTED", (action) => {
		return (shapeId: string, cpId: string) => action({ shapeId, cpId });
	}),

	clearShapeSelection: createAction("sh_sel/CLEAR_SELECTION", (action) => {
		return (shapeId: string) => action({ shapeId });
	}),
};

export interface ShapeSelectionState {
	[shapeId: string]: ShapeSelection;
}

export const initialShapeSelectionState: ShapeSelectionState = {};

const createNewShapeSelection = (): ShapeSelection => ({
	nodes: {},
	edges: {},
	controlPoints: {},
});

type Action = ActionType<typeof shapeSelectionActions>;

const singleShapeSelectionReducer = (state: ShapeSelection, action: Action): ShapeSelection => {
	switch (action.type) {
		case getType(shapeSelectionActions.addNodeToSelection): {
			const { nodeId } = action.payload;

			return {
				...state,
				nodes: { ...state.nodes, [nodeId]: true },
			};
		}

		case getType(shapeSelectionActions.toggleNodeSelection): {
			const { nodeId } = action.payload;

			return {
				...state,
				nodes: state.nodes[nodeId]
					? removeKeysFromMap(state.nodes, [nodeId])
					: { ...state.nodes, [nodeId]: true },
			};
		}

		case getType(shapeSelectionActions.addEdgeToSelection): {
			const { edgeId } = action.payload;

			return {
				...state,
				edges: { ...state.edges, [edgeId]: true },
			};
		}

		case getType(shapeSelectionActions.toggleEdgeSelection): {
			const { edgeId } = action.payload;

			return {
				...state,
				edges: state.edges[edgeId]
					? removeKeysFromMap(state.edges, [edgeId])
					: { ...state.edges, [edgeId]: true },
			};
		}

		case getType(shapeSelectionActions.addControlPointToSelection): {
			const { cpId } = action.payload;

			return {
				...state,
				controlPoints: { ...state.controlPoints, [cpId]: true },
			};
		}

		case getType(shapeSelectionActions.toggleControlPointSelection): {
			const { cpId } = action.payload;

			return {
				...state,
				controlPoints: state.controlPoints[cpId]
					? removeKeysFromMap(state.controlPoints, [cpId])
					: { ...state.controlPoints, [cpId]: true },
			};
		}

		case getType(shapeSelectionActions.clearShapeSelection): {
			return createNewShapeSelection();
		}

		default:
			return state;
	}
};

export const shapeSelectionReducer = (
	state: ShapeSelectionState = initialShapeSelectionState,
	action: Action,
): ShapeSelectionState => {
	const shapeId = action.payload.shapeId;
	const selection = state[shapeId] || createNewShapeSelection();

	return {
		...state,
		[shapeId]: singleShapeSelectionReducer(selection, action),
	};
};
