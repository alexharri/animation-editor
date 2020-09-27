import { ActionType, getType } from "typesafe-actions";
import { DEFAULT_FLOW_NODE_WIDTH } from "~/constants";
import { getFlowNodeDefaultInputs, getFlowNodeDefaultOutputs } from "~/flow/flowIO";
import { getFlowNodeDefaultState } from "~/flow/flowNodeState";
import { FlowGraph, FlowNode, FlowNodeInput, FlowNodeType } from "~/flow/flowTypes";
import {
	removeNodeAndReferencesToItInFlowGraph,
	removeReferencesToNodeInFlowGraph,
} from "~/flow/flowUtils";
import { flowActions as actions } from "~/flow/state/flowActions";
import { removeKeysFromMap } from "~/util/mapUtils";

type FlowAction = ActionType<typeof actions>;

export interface FlowState {
	graphs: {
		[graphId: string]: FlowGraph;
	};
}

const createNodeId = (nodes: { [key: string]: any }) =>
	(
		Math.max(
			0,
			...Object.keys(nodes)
				.map((x) => parseInt(x))
				.filter((x) => !isNaN(x)),
		) + 1
	).toString();

export const initialFlowState: FlowState = {
	graphs: {},
};

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
	switch (action.type) {
		case getType(actions.setGraph): {
			const { graph } = action.payload;
			return {
				...state,
				graphs: {
					...state.graphs,
					[graph.id]: graph,
				},
			};
		}

		case getType(actions.removeGraph): {
			const { graphId } = action.payload;
			return {
				...state,
				graphs: removeKeysFromMap(state.graphs, [graphId]),
			};
		}
	}

	if (!action.payload) {
		console.trace();
		console.log(action);
	}

	const graphId = action.payload.graphId;
	const graph = state.graphs[graphId];
	return {
		...state,
		graphs: {
			...state.graphs,
			[graphId]: graphReducer(graph, action),
		},
	};
}

function graphReducer(state: FlowGraph, action: FlowAction): FlowGraph {
	switch (action.type) {
		case getType(actions.setMoveVector): {
			const { moveVector } = action.payload;
			return { ...state, moveVector };
		}

		case getType(actions.applyMoveVector): {
			const { moveVector } = state;
			const { selection } = action.payload;
			return {
				...state,
				moveVector: Vec2.new(0, 0),
				nodes: Object.keys(state.nodes).reduce<FlowGraph["nodes"]>((obj, nodeId) => {
					const node = state.nodes[nodeId];

					obj[nodeId] = selection.nodes[nodeId]
						? { ...node, position: node.position.add(moveVector) }
						: node;

					return obj;
				}, {}),
			};
		}

		case getType(actions.removeNode): {
			const { nodeId } = action.payload;

			return {
				...removeNodeAndReferencesToItInFlowGraph(nodeId, state),
			};
		}

		case getType(actions.removeReferencesToNodeInGraph): {
			const { nodeId } = action.payload;

			return {
				...removeReferencesToNodeInFlowGraph(nodeId, state),
			};
		}

		case getType(actions.startAddNode): {
			const { type, io } = action.payload;
			return { ...state, _addNodeOfTypeOnClick: { type, io } };
		}

		case getType(actions.submitAddNode): {
			const { position } = action.payload;
			const id = createNodeId(state.nodes);
			const { type, io } = state._addNodeOfTypeOnClick!;

			return {
				...state,
				_addNodeOfTypeOnClick: null,
				nodes: {
					...state.nodes,
					[id]: {
						id,
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
			const { nodeId, state: _state } = action.payload;
			const node = state.nodes[nodeId];

			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: {
						...node,
						state: {
							...node.state,
							...(_state as any),
						},
					},
				},
			};
		}

		case getType(actions.setDragSelectRect): {
			const { rect } = action.payload;
			return { ...state, _dragSelectRect: rect };
		}

		case getType(actions.setDragSelectRect): {
			const { rect } = action.payload;
			return { ...state, _dragSelectRect: rect };
		}

		case getType(actions.initDragOutputTo): {
			const { position, fromOutput } = action.payload;
			return {
				...state,
				_dragOutputTo: {
					position,
					fromOutput,
					wouldConnectToInput: null,
				},
			};
		}

		case getType(actions.setDragOutputTo): {
			if (!state._dragOutputTo) {
				return state;
			}

			const { position, wouldConnectToInput } = action.payload;
			return {
				...state,
				_dragOutputTo: {
					...state._dragOutputTo,
					position,
					wouldConnectToInput,
				},
			};
		}

		case getType(actions.submitDragOutputTo): {
			if (!state._dragOutputTo?.wouldConnectToInput) {
				return state;
			}

			const { outputIndex, nodeId: outputNodeId } = state._dragOutputTo.fromOutput;
			const { inputIndex, nodeId: inputNodeId } = state._dragOutputTo.wouldConnectToInput;

			const inputNode = state.nodes[inputNodeId];

			return {
				...state,
				nodes: {
					...state.nodes,
					[inputNodeId]: {
						...inputNode,
						inputs: inputNode.inputs.map<FlowNodeInput>((input, i) =>
							i === inputIndex
								? {
										...input,
										pointer: {
											nodeId: outputNodeId,
											outputIndex,
										},
								  }
								: input,
						),
					},
				},
				_dragOutputTo: null,
			};
		}

		case getType(actions.initDragInputTo): {
			const { position, fromInput } = action.payload;
			return {
				...state,
				_dragInputTo: {
					position,
					fromInput,
					wouldConnectToOutput: null,
				},
			};
		}

		case getType(actions.setDragInputTo): {
			if (!state._dragInputTo) {
				return state;
			}

			const { position, wouldConnectToOutput } = action.payload;
			return {
				...state,
				_dragInputTo: {
					...state._dragInputTo,
					position,
					wouldConnectToOutput,
				},
			};
		}

		case getType(actions.submitDragInputTo): {
			if (!state._dragInputTo?.wouldConnectToOutput) {
				return state;
			}

			const { inputIndex, nodeId: inputNodeId } = state._dragInputTo.fromInput;
			const { outputIndex, nodeId: outputNodeId } = state._dragInputTo.wouldConnectToOutput;

			const inputNode = state.nodes[inputNodeId];

			return {
				...state,
				nodes: {
					...state.nodes,
					[inputNodeId]: {
						...inputNode,
						inputs: inputNode.inputs.map<FlowNodeInput>((input, i) =>
							i === inputIndex
								? {
										...input,
										pointer: {
											nodeId: outputNodeId,
											outputIndex,
										},
								  }
								: input,
						),
					},
				},
				_dragInputTo: null,
			};
		}

		case getType(actions.clearDragOutputTo): {
			return { ...state, _dragOutputTo: null };
		}

		case getType(actions.removeInputPointer): {
			const { nodeId, inputIndex } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: {
						...node,
						inputs: node.inputs.map<FlowNodeInput>((input, i) =>
							i === inputIndex
								? {
										...input,
										pointer: null,
								  }
								: input,
						),
					},
				},
			};
		}

		case getType(actions.setNodeOutputs): {
			const { nodeId, outputs } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: { ...node, outputs },
				},
			};
		}

		case getType(actions.setNodeInputs): {
			const { nodeId, inputs } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: { ...node, inputs },
				},
			};
		}

		case getType(actions.addNodeOutput): {
			const { nodeId, output } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: { ...node, outputs: [...node.outputs, output] },
				},
			};
		}

		case getType(actions.addNodeInput): {
			const { nodeId, input } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: { ...node, inputs: [...node.inputs, input] },
				},
			};
		}

		case getType(actions.addNodeOutput): {
			const { nodeId, output } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: { ...node, outputs: [...node.outputs, output] },
				},
			};
		}

		case getType(actions.removeNodeInputs): {
			const { nodeId, indices } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: {
						...node,
						inputs: node.inputs.filter((_, i) => indices.indexOf(i) === -1),
					},
				},
			};
		}

		case getType(actions.removeNodeOutputs): {
			const { nodeId, indices } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: {
						...node,
						outputs: node.outputs.filter((_, i) => indices.indexOf(i) === -1),
					},
				},
			};
		}

		case getType(actions.setNodeWidth): {
			const { nodeId, width } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: {
						...node,
						width,
					},
				},
			};
		}

		case getType(actions.setNodeInputValue): {
			const { nodeId, inputIndex, value } = action.payload;
			const node = state.nodes[nodeId];
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: {
						...node,
						inputs: node.inputs.map((input, i) =>
							i === inputIndex
								? {
										...input,
										value,
								  }
								: input,
						),
					},
				},
			};
		}

		case getType(actions.setExpressionNodeTextareaHeight): {
			const { nodeId, height } = action.payload;
			const node = state.nodes[nodeId] as FlowNode<FlowNodeType.expr>;
			return {
				...state,
				nodes: {
					...state.nodes,
					[nodeId]: {
						...node,
						state: {
							...node.state,
							textareaHeight: height,
						},
					},
				},
			};
		}

		default:
			return state;
	}
}
