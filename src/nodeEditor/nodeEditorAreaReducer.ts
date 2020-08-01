import { ActionType, getType } from "typesafe-actions";
import { nodeEditorAreaActions } from "~/nodeEditor/nodeEditorAreaActions";

type ToolAction = ActionType<typeof nodeEditorAreaActions>;

export interface NodeEditorAreaState {
	pan: Vec2;
	scale: number;
	graphId: string;
}

export const initialNodeEditorAreaState: NodeEditorAreaState = {
	pan: Vec2.new(0, 0),
	scale: 1,
	graphId: "",
};

export const nodeEditorAreaReducer = (
	state = initialNodeEditorAreaState,
	action: ToolAction,
): NodeEditorAreaState => {
	switch (action.type) {
		case getType(nodeEditorAreaActions.setGraphId): {
			const { graphId } = action.payload;
			return { ...state, graphId };
		}

		case getType(nodeEditorAreaActions.setPan): {
			const { pan } = action.payload;
			return { ...state, pan };
		}

		case getType(nodeEditorAreaActions.setScale): {
			const { scale } = action.payload;
			return { ...state, scale };
		}

		default:
			return state;
	}
};
