import { createAction } from "typesafe-actions";
import { NodeEditorNodeType } from "~/types";

export const nodeEditorGraphActions = {
	/**
	 * Add node
	 */
	startAddNode: createAction("nodeEditorGraph/START_ADD_NODE", (action) => {
		return (type: NodeEditorNodeType) => action({ type });
	}),

	submitAddNode: createAction("nodeEditorGraph/SUBMIT_ADD_NODE", (action) => {
		return (position: Vec2) => action({ position });
	}),

	/**
	 * Drag output to
	 */
	initDragOutputTo: createAction("nodeEditorGraph/INIT_DRAG_OUTPUT_TO", (action) => {
		return (position: Vec2, fromOutput: { nodeId: string; outputIndex: number }) =>
			action({ position, fromOutput });
	}),

	setDragOutputTo: createAction("nodeEditorGraph/SET_DRAG_OUTPUT_TO", (action) => {
		return (
			position: Vec2,
			wouldConnectToInput: { nodeId: string; inputIndex: number } | null,
		) => action({ position, wouldConnectToInput });
	}),

	submitDragOutputTo: createAction("nodeEditorGraph/SUBMIT_DRAG_OUTPUT_TO", (action) => {
		return () => action({});
	}),

	clearDragOutputTo: createAction("nodeEditorGraph/CLEAR_DRAG_OUTPUT_TO", (action) => {
		return () => action({});
	}),

	/**
	 * Drag input to
	 */
	initDragInputTo: createAction("nodeEditorGraph/INIT_DRAG_INPUT_TO", (action) => {
		return (position: Vec2, fromInput: { nodeId: string; inputIndex: number }) =>
			action({ position, fromInput });
	}),

	setDragInputTo: createAction("nodeEditorGraph/SET_DRAG_INPUT_TO", (action) => {
		return (
			position: Vec2,
			wouldConnectToOutput: { nodeId: string; outputIndex: number } | null,
		) => action({ position, wouldConnectToOutput });
	}),

	submitDragInputTo: createAction("nodeEditorGraph/SUBMIT_DRAG_INPUT_TO", (action) => {
		return () => action({});
	}),

	/**
	 * Pointer
	 */
	removeInputPointer: createAction("nodeEditorGraph/REMOVE_INPUT_POINTER", (action) => {
		return (nodeId: string, inputIndex: number) => action({ nodeId, inputIndex });
	}),

	/**
	 * Selection
	 */
	setDragSelectRect: createAction("nodeEditorGraph/SET_DRAG_SELECT_RECT", (action) => {
		return (rect: Rect) => action({ rect });
	}),

	submitDragSelectRect: createAction("nodeEditorGraph/SUBMIT_DRAG_SELECT", (action) => {
		return (additiveSelection: boolean) => action({ additiveSelection });
	}),

	addNodeToSelection: createAction("nodeEditorGraph/ADD_NODE_TO_SELECTION", (action) => {
		return (nodeId: string) => action({ nodeId });
	}),

	removeNodeFromSelection: createAction(
		"nodeEditorGraph/REMOVE_NODE_FROM_SELECTION",
		(action) => {
			return (nodeId: string) => action({ nodeId });
		},
	),

	toggleNodeSelection: createAction("nodeEditorGraph/TOGGLE_NODE_SELECTION", (action) => {
		return (nodeId: string) => action({ nodeId });
	}),

	clearNodeSelection: createAction("nodeEditorGraph/CLEAR_SELECTION", (action) => {
		return () => action({});
	}),

	/**
	 * Move node
	 */
	setMoveVector: createAction("nodeEditorGraph/SET_MOVE_VECTOR", (action) => {
		return (moveVector: Vec2) => action({ moveVector });
	}),

	applyMoveVector: createAction("nodeEditorGraph/APPLY_MOVE_VECTOR", (action) => {
		return () => action({});
	}),

	/**
	 * Create and delete nodes
	 */
	// addNode: createAction("nodeEditorGraph/ADD_NODE", action => {
	// 	return () => ({});
	// })
	removeNode: createAction("nodeEditorGraph/REMOVE_NODE", (action) => {
		return (nodeId: string) => action({ nodeId });
	}),
};
