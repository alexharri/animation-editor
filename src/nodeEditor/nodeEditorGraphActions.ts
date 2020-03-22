import { createAction } from "typesafe-actions";

export const nodeEditorGraphActions = {
	addNodeToSelection: createAction("nodeEditorGraph/ADD_NODE_TO_SELECTION", action => {
		return (nodeId: string) => action({ nodeId });
	}),

	removeNodeFromSelection: createAction("nodeEditorGraph/REMOVE_NODE_FROM_SELECTION", action => {
		return (nodeId: string) => action({ nodeId });
	}),

	toggleNodeSelection: createAction("nodeEditorGraph/TOGGLE_NODE_SELECTION", action => {
		return (nodeId: string) => action({ nodeId });
	}),

	clearNodeSelection: createAction("nodeEditorGraph/CLEAR_SELECTION", action => {
		return () => action({});
	}),

	setMoveVector: createAction("nodeEditorGraph/SET_MOVE_VECTOR", action => {
		return (moveVector: Vec2) => action({ moveVector });
	}),

	applyMoveVector: createAction("nodeEditorGraph/APPLY_MOVE_VECTOR", action => {
		return () => action({});
	}),
};
