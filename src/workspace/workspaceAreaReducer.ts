import { ActionType, createAction, getType } from "typesafe-actions";

export interface CompositionWorkspaceAreaState {
	compositionId: string;
	pan: Vec2;
	scale: number;
}

export const initialCompositionWorkspaceAreaState: CompositionWorkspaceAreaState = {
	compositionId: "",
	pan: Vec2.new(0, 0),
	scale: 1,
};

export const compositionWorkspaceAreaActions = {
	setPan: createAction("nodeEditorArea/SET_PAN", (action) => {
		return (pan: Vec2) => action({ pan });
	}),

	setScale: createAction("nodeEditorArea/SET_SCALE", (action) => {
		return (scale: number) => action({ scale });
	}),
};

type Action = ActionType<typeof compositionWorkspaceAreaActions>;

export const compositionWorkspaceAreaReducer = (
	state = initialCompositionWorkspaceAreaState,
	action: Action,
): CompositionWorkspaceAreaState => {
	switch (action.type) {
		case getType(compositionWorkspaceAreaActions.setPan): {
			const { pan } = action.payload;
			return { ...state, pan };
		}

		case getType(compositionWorkspaceAreaActions.setScale): {
			const { scale } = action.payload;
			return { ...state, scale };
		}

		default:
			return state;
	}
};
