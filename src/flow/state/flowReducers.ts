import { ActionType, getType } from "typesafe-actions";
import { DEFAULT_FLOW_NODE_WIDTH } from "~/constants";
import { getFlowNodeDefaultInputs, getFlowNodeDefaultOutputs } from "~/flow/flowIO";
import { getFlowNodeDefaultState } from "~/flow/flowNodeState";
import { FlowGraph, FlowNode, FlowNodeInput } from "~/flow/flowTypes";
import { removeFlowNodeAndReferencesToIt, removeReferencesToFlowNode } from "~/flow/flowUtils";
import { flowActions as actions } from "~/flow/state/flowActions";
import {
	createMapNumberId,
	mergeItemInMap,
	modifyItemsInMap,
	removeKeysFromMap,
} from "~/util/mapUtils";

type FlowAction = ActionType<typeof actions>;

export interface FlowState {
	graphs: {
		[graphId: string]: FlowGraph;
	};
	nodes: {
		[nodeId: string]: FlowNode;
	};
}

export const initialFlowState: FlowState = {
	graphs: {},
	nodes: {},
};

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
	switch (action.type) {
		case getType(actions.setGraph): {
			const { graph } = action.payload;
			return { ...state, graphs: { ...state.graphs, [graph.id]: graph } };
		}

		case getType(actions.setNode): {
			const { node } = action.payload;
			return { ...state, nodes: { ...state.nodes, [node.id]: node } };
		}

		case getType(actions.setNodePosition): {
			const { nodeId, position } = action.payload;
			return { ...state, nodes: mergeItemInMap(state.nodes, nodeId, () => ({ position })) };
		}

		case getType(actions.removeGraph): {
			const { graphId } = action.payload;
			return {
				...state,
				graphs: removeKeysFromMap(state.graphs, [graphId]),
			};
		}

		case getType(actions.removeNode): {
			const { nodeId } = action.payload;
			return removeFlowNodeAndReferencesToIt(nodeId, state);
		}

		case getType(actions.removeReferencesToNodeInGraph): {
			const { nodeId } = action.payload;
			return removeReferencesToFlowNode(nodeId, state);
		}

		case getType(actions.startAddNode): {
			const { graphId, type, io } = action.payload;
			return {
				...state,
				graphs: modifyItemsInMap(state.graphs, graphId, (graph) => ({
					...graph,
					_addNodeOfTypeOnClick: { type, io },
				})),
			};
		}

		case getType(actions.submitAddNode): {
			const { graphId, position } = action.payload;
			const nodeId = createMapNumberId(state.nodes);
			const graph = state.graphs[graphId];
			const { type, io } = graph._addNodeOfTypeOnClick!;

			return {
				...state,
				graphs: modifyItemsInMap(state.graphs, graphId, (graph) => ({
					...graph,
					_addNodeOfTypeOnClick: null,
					nodes: [...graph.nodes, nodeId],
				})),
				nodes: {
					...state.nodes,
					[nodeId]: {
						id: nodeId,
						graphId: graph.id,
						type,
						position,
						width: DEFAULT_FLOW_NODE_WIDTH,
						inputs: io?.inputs || getFlowNodeDefaultInputs(type),
						outputs: io?.outputs || getFlowNodeDefaultOutputs(type),
						state: getFlowNodeDefaultState(type),
					},
				},
			};
		}

		case getType(actions.updateNodeState): {
			const { nodeId, state: nodeState } = action.payload;
			return {
				...state,
				nodes: modifyItemsInMap(state.nodes, nodeId, (node) => ({
					...node,
					state: { ...node.state, ...(nodeState as any) },
				})),
			};
		}
		case getType(actions.setDragSelectRect): {
			const { graphId, rect } = action.payload;
			return {
				...state,
				graphs: mergeItemInMap(state.graphs, graphId, () => ({ _dragSelectRect: rect })),
			};
		}

		case getType(actions.setDragSelectRect): {
			const { graphId, rect } = action.payload;
			return {
				...state,
				graphs: mergeItemInMap(state.graphs, graphId, () => ({ _dragSelectRect: rect })),
			};
		}

		case getType(actions.connectInputToOutput): {
			const { outputNodeId, outputIndex, inputNodeId, inputIndex } = action.payload;

			return {
				...state,
				nodes: mergeItemInMap(state.nodes, inputNodeId, (node) => ({
					inputs: node.inputs.map<FlowNodeInput>((input, i) =>
						i === inputIndex
							? { ...input, pointer: { nodeId: outputNodeId, outputIndex } }
							: input,
					),
				})),
			};
		}

		case getType(actions.removeInputPointer): {
			const { nodeId, inputIndex } = action.payload;
			return {
				...state,
				nodes: mergeItemInMap(state.nodes, nodeId, (node) => ({
					inputs: node.inputs.map<FlowNodeInput>((input, i) =>
						i === inputIndex ? { ...input, pointer: null } : input,
					),
				})),
			};
		}

		case getType(actions.setNodeOutputs): {
			const { nodeId, outputs } = action.payload;
			return { ...state, nodes: mergeItemInMap(state.nodes, nodeId, () => ({ outputs })) };
		}

		case getType(actions.setNodeInputs): {
			const { nodeId, inputs } = action.payload;
			return { ...state, nodes: mergeItemInMap(state.nodes, nodeId, () => ({ inputs })) };
		}

		case getType(actions.addNodeOutput): {
			const { nodeId, output } = action.payload;
			return {
				...state,
				nodes: mergeItemInMap(state.nodes, nodeId, (node) => ({
					outputs: [...node.outputs, output],
				})),
			};
		}

		case getType(actions.addNodeInput): {
			const { nodeId, input } = action.payload;
			return {
				...state,
				nodes: mergeItemInMap(state.nodes, nodeId, (node) => ({
					inputs: [...node.inputs, input],
				})),
			};
		}

		case getType(actions.removeNodeInputs): {
			const { nodeId, indices } = action.payload;
			return {
				...state,
				nodes: mergeItemInMap(state.nodes, nodeId, (node) => ({
					inputs: node.inputs.filter((_, i) => indices.indexOf(i) === -1),
				})),
			};
		}

		case getType(actions.removeNodeOutputs): {
			const { nodeId, indices } = action.payload;
			return {
				...state,
				nodes: mergeItemInMap(state.nodes, nodeId, (node) => ({
					outputs: node.outputs.filter((_, i) => indices.indexOf(i) === -1),
				})),
			};
		}

		case getType(actions.setNodeWidth): {
			const { nodeId, width } = action.payload;
			return { ...state, nodes: mergeItemInMap(state.nodes, nodeId, () => ({ width })) };
		}

		case getType(actions.setNodeInputValue): {
			const { nodeId, inputIndex, value } = action.payload;
			return {
				...state,
				nodes: mergeItemInMap(state.nodes, nodeId, (node) => ({
					inputs: node.inputs.map((input, i) =>
						i === inputIndex ? { ...input, value } : input,
					),
				})),
			};
		}

		case getType(actions.setExpressionNodeTextareaHeight): {
			const { nodeId, height } = action.payload;
			return {
				...state,
				nodes: mergeItemInMap(state.nodes, nodeId, (node) => ({
					state: { ...node.state, textareaHeight: height },
				})),
			};
		}

		default:
			return state;
	}
}
