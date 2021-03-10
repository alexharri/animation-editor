import { createAction } from "typesafe-actions";
import { FlowNodeState } from "~/flow/flowNodeState";
import {
	FlowGraph,
	FlowNode,
	FlowNodeInput,
	FlowNodeIO,
	FlowNodeOutput,
	FlowNodeType,
} from "~/flow/flowTypes";
import { FlowGraphSelection } from "~/flow/state/flowSelectionReducer";

export const flowActions = {
	/**
	 * Graph
	 */
	setGraph: createAction("flowGraph/SET_GRAPH", (action) => {
		return (graph: FlowGraph) => action({ graph });
	}),

	removeGraph: createAction("flowGraph/REMOVE_GRAPH", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	/**
	 * Node
	 */
	setNode: createAction("flowGraph/SET_NODE", (action) => {
		return (node: FlowNode) => action({ node });
	}),

	/**
	 * Add node
	 */
	startAddNode: createAction("flowGraph/START_ADD_NODE", (action) => {
		return (graphId: string, type: FlowNodeType, io?: FlowNodeIO) =>
			action({ graphId, type, io });
	}),

	submitAddNode: createAction("flowGraph/SUBMIT_ADD_NODE", (action) => {
		return (graphId: string, position: Vec2) => action({ graphId, position });
	}),

	/**
	 * Drag output to
	 */
	initDragOutputTo: createAction("flowGraph/INIT_DRAG_OUTPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			fromOutput: { nodeId: string; outputIndex: number },
		) => action({ graphId, position, fromOutput });
	}),

	setDragOutputTo: createAction("flowGraph/SET_DRAG_OUTPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			wouldConnectToInput: { nodeId: string; inputIndex: number } | null,
		) => action({ graphId, position, wouldConnectToInput });
	}),

	submitDragOutputTo: createAction("flowGraph/SUBMIT_DRAG_OUTPUT_TO", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	clearDragOutputTo: createAction("flowGraph/CLEAR_DRAG_OUTPUT_TO", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	/**
	 * Drag input to
	 */
	initDragInputTo: createAction("flowGraph/INIT_DRAG_INPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			fromInput: { nodeId: string; inputIndex: number },
		) => action({ graphId, position, fromInput });
	}),

	setDragInputTo: createAction("flowGraph/SET_DRAG_INPUT_TO", (action) => {
		return (
			graphId: string,
			position: Vec2,
			wouldConnectToOutput: { nodeId: string; outputIndex: number } | null,
		) => action({ graphId, position, wouldConnectToOutput });
	}),

	submitDragInputTo: createAction("flowGraph/SUBMIT_DRAG_INPUT_TO", (action) => {
		return (graphId: string) => action({ graphId });
	}),

	/**
	 * Pointer
	 */
	removeInputPointer: createAction("flowGraph/REMOVE_INPUT_POINTER", (action) => {
		return (graphId: string, nodeId: string, inputIndex: number) =>
			action({ graphId, nodeId, inputIndex });
	}),

	/**
	 * Selection
	 */
	setDragSelectRect: createAction("flowGraph/SET_DRAG_SELECT_RECT", (action) => {
		return (graphId: string, rect: Rect | null) => action({ graphId, rect });
	}),

	submitDragSelectRect: createAction("flowGraph/SUBMIT_DRAG_SELECT", (action) => {
		return (graphId: string, additiveSelection: boolean) =>
			action({ graphId, additiveSelection });
	}),

	/**
	 * Move node
	 */
	setMoveVector: createAction("flowGraph/SET_MOVE_VECTOR", (action) => {
		return (graphId: string, moveVector: Vec2) => action({ graphId, moveVector });
	}),

	applyMoveVector: createAction("flowGraph/APPLY_MOVE_VECTOR", (action) => {
		return (graphId: string, selection: FlowGraphSelection) => action({ graphId, selection });
	}),

	/**
	 * Resize node
	 */
	setNodeWidth: createAction("flowGraph/SET_NODE_WIDTH", (action) => {
		return (graphId: string, nodeId: string, width: number) =>
			action({ graphId, nodeId, width });
	}),

	setExpressionNodeTextareaHeight: createAction(
		"flowGraph/SET_EXPR_NODE_TEXTAREA_HEIGHT",
		(action) => {
			return (graphId: string, nodeId: string, height: number) =>
				action({ graphId, nodeId, height });
		},
	),

	/**
	 * Modify node state
	 */
	updateNodeState: createAction("flowGraph/UPDATE_NODE_STATE", (action) => {
		return <T extends FlowNodeType>(
			graphId: string,
			nodeId: string,
			state: Partial<FlowNodeState<T>>,
		) => action({ graphId, nodeId, state });
	}),

	/**
	 * Create and delete nodes
	 */
	removeNode: createAction("flowGraph/REMOVE_NODE", (action) => {
		return (graphId: string, nodeId: string) => action({ graphId, nodeId });
	}),
	removeReferencesToNodeInGraph: createAction("flowGraph/REMOVE_NODE_REFS", (action) => {
		return (graphId: string, nodeId: string) => action({ graphId, nodeId });
	}),

	/**
	 * Node IO
	 */
	setNodeInputs: createAction("flowGraph/SET_INPUTS", (action) => {
		return (graphId: string, nodeId: string, inputs: FlowNodeInput[]) =>
			action({ graphId, nodeId, inputs });
	}),
	setNodeOutputs: createAction("flowGraph/SET_OUTPUTS", (action) => {
		return (graphId: string, nodeId: string, outputs: FlowNodeOutput[]) =>
			action({ graphId, nodeId, outputs });
	}),
	addNodeInput: createAction("flowGraph/ADD_INPUT", (action) => {
		return (graphId: string, nodeId: string, input: FlowNodeInput) =>
			action({ graphId, nodeId, input });
	}),
	removeNodeInputs: createAction("flowGraph/REMOVE_INPUTS", (action) => {
		return (graphId: string, nodeId: string, indices: number[]) =>
			action({ graphId, nodeId, indices });
	}),
	addNodeOutput: createAction("flowGraph/ADD_OUTPUT", (action) => {
		return (graphId: string, nodeId: string, output: FlowNodeOutput) =>
			action({ graphId, nodeId, output });
	}),
	removeNodeOutputs: createAction("flowGraph/REMOVE_OUTPUTS", (action) => {
		return (graphId: string, nodeId: string, indices: number[]) =>
			action({ graphId, nodeId, indices });
	}),
	setNodeInputValue: createAction("flowGraph/SET_NODE_INPUT_VALUE", (action) => {
		return (graphId: string, nodeId: string, inputIndex: number, value: any) =>
			action({ graphId, nodeId, inputIndex, value });
	}),
};
