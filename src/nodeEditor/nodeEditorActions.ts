import { createAction } from "typesafe-actions";
import { NodeEditorNodeType } from "~/types";
import {
	NodeEditorNodeState,
	NodeEditorNodeInput,
	NodeEditorNodeOutput,
	NodeEditorNodeIO,
} from "~/nodeEditor/nodeEditorIO";

export const nodeEditorActions = {
	/**
	 * Add node
	 */
	startAddNode: createAction("nodeEditorGraph/START_ADD_NODE", (action) => {
		return (graphId: string, type: NodeEditorNodeType, io?: NodeEditorNodeIO) =>
			action({ graphId, type, io });
	}),

	submitAddNode: createAction("nodeEditorGraph/SUBMIT_ADD_NODE", (action) => {
		return (graphId: string, position: Vec2) => action({ graphId, position });
	}),

	/**
	 * Drag output to
	 */
	initDragOutputTo: createAction("nodeEditorGraph/INIT_DRAG_OUTPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			fromOutput: { nodeId: string; outputIndex: number },
		) => action({ graphId, position, fromOutput });
	}),

	setDragOutputTo: createAction("nodeEditorGraph/SET_DRAG_OUTPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			wouldConnectToInput: { nodeId: string; inputIndex: number } | null,
		) => action({ graphId, position, wouldConnectToInput });
	}),

	submitDragOutputTo: createAction("nodeEditorGraph/SUBMIT_DRAG_OUTPUT_TO", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	clearDragOutputTo: createAction("nodeEditorGraph/CLEAR_DRAG_OUTPUT_TO", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	/**
	 * Drag input to
	 */
	initDragInputTo: createAction("nodeEditorGraph/INIT_DRAG_INPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			fromInput: { nodeId: string; inputIndex: number },
		) => action({ graphId, position, fromInput });
	}),

	setDragInputTo: createAction("nodeEditorGraph/SET_DRAG_INPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			wouldConnectToOutput: { nodeId: string; outputIndex: number } | null,
		) => action({ graphId, position, wouldConnectToOutput });
	}),

	submitDragInputTo: createAction("nodeEditorGraph/SUBMIT_DRAG_INPUT_TO", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	/**
	 * Pointer
	 */
	removeInputPointer: createAction("nodeEditorGraph/REMOVE_INPUT_POINTER", (action) => {
		return (graphId: string, nodeId: string, inputIndex: number) =>
			action({ graphId, nodeId, inputIndex });
	}),

	/**
	 * Selection
	 */
	setDragSelectRect: createAction("nodeEditorGraph/SET_DRAG_SELECT_RECT", (action) => {
		return (graphId: string, rect: Rect) => action({ graphId, rect });
	}),

	submitDragSelectRect: createAction("nodeEditorGraph/SUBMIT_DRAG_SELECT", (action) => {
		return (graphId: string, additiveSelection: boolean) =>
			action({ graphId, additiveSelection });
	}),

	addNodeToSelection: createAction("nodeEditorGraph/ADD_NODE_TO_SELECTION", (action) => {
		return (graphId: string, nodeId: string) => action({ graphId, nodeId });
	}),

	removeNodeFromSelection: createAction(
		"nodeEditorGraph/REMOVE_NODE_FROM_SELECTION",
		(action) => {
			return (graphId: string, nodeId: string) => action({ graphId, nodeId });
		},
	),

	toggleNodeSelection: createAction("nodeEditorGraph/TOGGLE_NODE_SELECTION", (action) => {
		return (graphId: string, nodeId: string) => action({ graphId, nodeId });
	}),

	clearNodeSelection: createAction("nodeEditorGraph/CLEAR_SELECTION", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	/**
	 * Move node
	 */
	setMoveVector: createAction("nodeEditorGraph/SET_MOVE_VECTOR", (action) => {
		return (graphId: string, moveVector: Vec2) => action({ graphId, moveVector });
	}),

	applyMoveVector: createAction("nodeEditorGraph/APPLY_MOVE_VECTOR", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	/**
	 * Resize node
	 */
	setNodeWidth: createAction("nodeEditorGraph/SET_NODE_WIDTH", (action) => {
		return (graphId: string, nodeId: string, width: number) =>
			action({ graphId, nodeId, width });
	}),

	setExpressionNodeTextareaHeight: createAction(
		"nodeEditorGraph/SET_EXPR_NODE_TEXTAREA_HEIGHT",
		(action) => {
			return (graphId: string, nodeId: string, height: number) =>
				action({ graphId, nodeId, height });
		},
	),

	/**
	 * Modify node state
	 */
	updateNodeState: createAction("nodeEditorGraph/UPDATE_NODE_STATE", (action) => {
		return <T extends NodeEditorNodeType>(
			graphId: string,
			nodeId: string,
			state: Partial<NodeEditorNodeState<T>>,
		) => action({ graphId, nodeId, state });
	}),

	/**
	 * Create and delete nodes
	 */
	removeNode: createAction("nodeEditorGraph/REMOVE_NODE", (action) => {
		return (graphId: string, nodeId: string) => action({ graphId, nodeId });
	}),

	/**
	 * Node IO
	 */
	addNodeInput: createAction("nodeEditorGraph/ADD_INPUT", (action) => {
		return (graphId: string, nodeId: string, input: NodeEditorNodeInput) =>
			action({ graphId, nodeId, input });
	}),
	removeNodeInputs: createAction("nodeEditorGraph/REMOVE_INPUTS", (action) => {
		return (graphId: string, nodeId: string, indices: number[]) =>
			action({ graphId, nodeId, indices });
	}),
	addNodeOutput: createAction("nodeEditorGraph/ADD_OUTPUT", (action) => {
		return (graphId: string, nodeId: string, output: NodeEditorNodeOutput) =>
			action({ graphId, nodeId, output });
	}),
	removeNodeOutputs: createAction("nodeEditorGraph/REMOVE_OUTPUTS", (action) => {
		return (graphId: string, nodeId: string, indices: number[]) =>
			action({ graphId, nodeId, indices });
	}),
	setNodeInputValue: createAction("nodeEditorGraph/SET_NODE_INPUT_VALUE", (action) => {
		return (graphId: string, nodeId: string, inputIndex: number, value: any) =>
			action({ graphId, nodeId, inputIndex, value });
	}),
};
