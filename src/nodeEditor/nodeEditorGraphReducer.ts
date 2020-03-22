import { GraphEditorNode } from "~/types";
import { ActionType, getType } from "typesafe-actions";
import { nodeEditorGraphActions as actions } from "~/nodeEditor/nodeEditorGraphActions";

export type NodeEditorGraphAction = ActionType<typeof actions>;

export interface NodeEditorGraphState {
	moveVector: Vec2;
	nodes: {
		[nodeId: string]: GraphEditorNode;
	};
	selection: {
		nodes: { [nodeId: string]: true };
	};
}

export const initialNodeEditorGraphState: NodeEditorGraphState = {
	moveVector: Vec2.new(0, 0),
	nodes: {
		0: {
			id: "0",
			position: Vec2.new(0, 0),
			type: "add",
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
					nodes: Object.keys(state.selection.nodes).reduce<{ [key: string]: true }>(
						(obj, id) => {
							if (nodeId !== id) {
								obj[id] = true;
							}
							return obj;
						},
						{},
					),
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

		default:
			return state;
	}
}
