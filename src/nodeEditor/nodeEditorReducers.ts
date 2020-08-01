import { ActionType, getType } from "typesafe-actions";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";
import { nodeEditorActions as actions } from "~/nodeEditor/nodeEditorActions";
import {
	getNodeEditorNodeDefaultInputs,
	getNodeEditorNodeDefaultOutputs,
	getNodeEditorNodeDefaultState,
	NodeEditorNode,
	NodeEditorNodeInput,
	NodeEditorNodeIO,
} from "~/nodeEditor/nodeEditorIO";
import {
	removeNodeAndReferencesToItInGraph,
	removeReferencesToNodeInGraph,
} from "~/nodeEditor/nodeEditorUtils";
import { calculateNodeHeight } from "~/nodeEditor/util/calculateNodeHeight";
import { KeySelectionMap, NodeEditorNodeType } from "~/types";
import { removeKeysFromMap } from "~/util/mapUtils";
import { rectsIntersect } from "~/util/math";

type NodeEditorAction = ActionType<typeof actions>;

export interface NodeEditorState {
	graphs: {
		[graphId: string]: NodeEditorGraphState;
	};
}

type Selection = KeySelectionMap;

export interface NodeEditorGraphState {
	id: string;
	layerId: string;
	moveVector: Vec2;
	nodes: {
		[nodeId: string]: NodeEditorNode<NodeEditorNodeType>;
	};
	selection: {
		nodes: Selection;
	};
	_addNodeOfTypeOnClick: { type: NodeEditorNodeType; io?: NodeEditorNodeIO } | null;
	_dragSelectRect: Rect | null;
	_dragOutputTo: {
		position: Vec2;
		fromOutput: { nodeId: string; outputIndex: number };
		wouldConnectToInput: {
			nodeId: string;
			inputIndex: number;
		} | null;
	} | null;
	_dragInputTo: {
		position: Vec2;
		fromInput: { nodeId: string; inputIndex: number };
		wouldConnectToOutput: {
			nodeId: string;
			outputIndex: number;
		} | null;
	} | null;
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

export const initialNodeEditorState: NodeEditorState = {
	graphs: {},
};

export function nodeEditorReducer(
	state: NodeEditorState,
	action: NodeEditorAction,
): NodeEditorState {
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

function graphReducer(state: NodeEditorGraphState, action: NodeEditorAction): NodeEditorGraphState {
	switch (action.type) {
		case getType(actions.addNodeToSelection): {
			const { nodeId } = action.payload;
			return {
				...state,
				selection: {
					...state.selection,
					nodes: {
						...state.selection.nodes,
						[nodeId]: true,
					},
				},
			};
		}

		case getType(actions.removeNodeFromSelection): {
			const { nodeId } = action.payload;
			return {
				...state,
				selection: {
					...state.selection,
					nodes: Object.keys(state.selection.nodes).reduce<Selection>((obj, id) => {
						if (nodeId !== id) {
							obj[id] = true;
						}
						return obj;
					}, {}),
				},
			};
		}

		case getType(actions.toggleNodeSelection): {
			const { graphId, nodeId } = action.payload;
			return state.selection.nodes[nodeId]
				? graphReducer(state, actions.removeNodeFromSelection(graphId, nodeId))
				: graphReducer(state, actions.addNodeToSelection(graphId, nodeId));
		}

		case getType(actions.clearNodeSelection): {
			return {
				...state,
				selection: {
					...state.selection,
					nodes: {},
				},
			};
		}

		case getType(actions.setMoveVector): {
			const { moveVector } = action.payload;
			return { ...state, moveVector };
		}

		case getType(actions.applyMoveVector): {
			const { moveVector } = state;
			return {
				...state,
				moveVector: Vec2.new(0, 0),
				nodes: Object.keys(state.nodes).reduce<NodeEditorGraphState["nodes"]>(
					(obj, nodeId) => {
						const node = state.nodes[nodeId];

						obj[nodeId] = state.selection.nodes[nodeId]
							? { ...node, position: node.position.add(moveVector) }
							: node;

						return obj;
					},
					{},
				),
			};
		}

		case getType(actions.removeNode): {
			const { nodeId } = action.payload;

			return {
				...removeNodeAndReferencesToItInGraph(nodeId, state),
				selection: {
					nodes: removeKeysFromMap(state.selection.nodes, [nodeId]),
				},
			};
		}

		case getType(actions.removeReferencesToNodeInGraph): {
			const { nodeId } = action.payload;

			return {
				...removeReferencesToNodeInGraph(nodeId, state),
				selection: state.selection,
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
						width: DEFAULT_NODE_EDITOR_NODE_WIDTH,
						inputs: io?.inputs || getNodeEditorNodeDefaultInputs(type),
						outputs: io?.outputs || getNodeEditorNodeDefaultOutputs(type),
						state: getNodeEditorNodeDefaultState(type),
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

		case getType(actions.submitDragSelectRect): {
			const { additiveSelection } = action.payload;

			return {
				...state,
				_dragSelectRect: null,
				selection: {
					...state.selection,
					nodes: Object.keys(state.nodes).reduce<{ [key: string]: true }>((obj, key) => {
						const node = state.nodes[key];
						const shouldBeSelected =
							(additiveSelection && state.selection.nodes[key]) ||
							rectsIntersect(state._dragSelectRect!, {
								left: node.position.x,
								top: node.position.y,
								height: calculateNodeHeight(node),
								width: node.width,
							});

						if (shouldBeSelected) {
							obj[key] = true;
						}

						return obj;
					}, {}),
				},
			};
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
						inputs: inputNode.inputs.map<NodeEditorNodeInput>((input, i) =>
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
						inputs: inputNode.inputs.map<NodeEditorNodeInput>((input, i) =>
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
						inputs: node.inputs.map<NodeEditorNodeInput>((input, i) =>
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
			const node = state.nodes[nodeId] as NodeEditorNode<NodeEditorNodeType.expr>;
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
