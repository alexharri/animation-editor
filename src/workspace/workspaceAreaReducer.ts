import { ActionType, createAction, getType } from "typesafe-actions";

export interface WorkspaceAreaState {
	compositionId: string;
	pan: Vec2;
	scale: number;
	selectionRect: Rect | null;
}

export const initialCompositionWorkspaceAreaState: WorkspaceAreaState = {
	compositionId: "",
	pan: Vec2.new(0, 0),
	scale: 1,
	selectionRect: null,
};

export const workspaceAreaActions = {
	setFields: createAction("workspaceArea/SET_FIELDS", (action) => {
		return (fields: Partial<WorkspaceAreaState>) => action({ fields });
	}),
};

type Action = ActionType<typeof workspaceAreaActions>;

export const compositionWorkspaceAreaReducer = (
	state = initialCompositionWorkspaceAreaState,
	action: Action,
): WorkspaceAreaState => {
	switch (action.type) {
		case getType(workspaceAreaActions.setFields): {
			const { fields } = action.payload;
			return { ...state, ...fields };
		}

		default:
			return state;
	}
};
