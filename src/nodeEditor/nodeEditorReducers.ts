import { ActionType, getType } from "typesafe-actions";
import {
	NodeEditorGraphState,
	initialNodeEditorGraphState,
	nodeEditorGraphReducer,
} from "~/nodeEditor/nodeEditorGraphReducer";
import { nodeEditorActions as actions } from "~/nodeEditor/nodeEditorActions";

type NodeEditorAction = ActionType<typeof actions>;

export interface NodeEditorState {
	graphs: {
		[graphId: string]: NodeEditorGraphState;
	};
}

export const initialNodeEditorState: NodeEditorState = {
	graphs: {
		0: initialNodeEditorGraphState,
	},
};

export function nodeEditorReducer(
	state: NodeEditorState,
	action: NodeEditorAction,
): NodeEditorState {
	switch (action.type) {
		case getType(actions.dispatchToGraph): {
			const { graphId, action: _action } = action.payload;
			return {
				...state,
				graphs: {
					...state.graphs,
					[graphId]: nodeEditorGraphReducer(state.graphs[graphId], _action),
				},
			};
		}

		default:
			return state;
	}
}
