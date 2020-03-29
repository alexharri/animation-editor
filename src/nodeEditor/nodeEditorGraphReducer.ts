import { ActionType, getType } from "typesafe-actions";
import { nodeEditorGraphActions as actions } from "~/nodeEditor/nodeEditorGraphActions";
import { NodeEditorNode, nodeEditorNodeInputsMap } from "~/nodeEditor/nodeEditorInputs";
import { NodeEditorNodeType } from "~/types";

export type NodeEditorGraphAction = ActionType<typeof actions>;

type Selection = { [id: string]: true };

export interface NodeEditorGraphState {
	moveVector: Vec2;
	nodes: {
		[nodeId: string]: NodeEditorNode<NodeEditorNodeType>;
	};
	selection: {
		nodes: Selection;
	};
}

export const initialNodeEditorGraphState: NodeEditorGraphState = {
	moveVector: Vec2.new(0, 0),
	nodes: {
		0: {
			id: "0",
			type: NodeEditorNodeType.add_vec2,
			position: Vec2.new(0, 0),
			width: 128,
			inputs: nodeEditorNodeInputsMap.add_vec2,
			inputPointers: nodeEditorNodeInputsMap.add_vec2.map(() => null),
		},
		1: {
			id: "1",
			type: NodeEditorNodeType.translate_rect,
			position: Vec2.new(100, 100),
			width: 128,
			inputs: nodeEditorNodeInputsMap.translate_rect,
			// inputPointers: nodeEditorNodeInputsMap.translate_rect.map(() => null),
			inputPointers: [null, { nodeId: "0", outputIndex: 0 }],
		},
	},
	selection: {
		nodes: {},
	},
};

export function nodeEditorGraphReducer(
	state: NodeEditorGraphState,
	action: NodeEditorGraphAction,
): NodeEditorGraphState {
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
			const { nodeId } = action.payload;
			return state.selection.nodes[nodeId]
				? nodeEditorGraphReducer(state, actions.removeNodeFromSelection(nodeId))
				: nodeEditorGraphReducer(state, actions.addNodeToSelection(nodeId));
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
				...state,
				selection: {
					nodes: Object.keys(state.selection.nodes).reduce<Selection>((obj, key) => {
						if (key !== nodeId) {
							obj[key] = state.selection.nodes[key];
						}
						return obj;
					}, {}),
				},
				nodes: Object.keys(state.nodes).reduce<NodeEditorGraphState["nodes"]>(
					(obj, key) => {
						if (key !== nodeId) {
							obj[key] = state.nodes[key];
						}
						return obj;
					},
					{},
				),
			};
		}

		default:
			return state;
	}
}
