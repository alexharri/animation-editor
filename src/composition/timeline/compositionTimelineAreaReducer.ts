import { ActionType, createAction, getType } from "typesafe-actions";

export interface CompositionTimelineAreaState {
	compositionId: string;
	viewBounds: [number, number];
	dragSelectRect: Rect | null;
}

export const initialCompositionTimelineAreaState: CompositionTimelineAreaState = {
	compositionId: "0",
	viewBounds: [0, 1],
	dragSelectRect: null,
};

export const compositionTimelineAreaActions = {
	setViewBounds: createAction("compTimeline/SET_VIEW_BOUNDS", (action) => {
		return (viewBounds: [number, number]) => action({ viewBounds });
	}),

	setFields: createAction("compTimeline/SET_FIELDS", (action) => {
		return (fields: Partial<CompositionTimelineAreaState>) => action({ fields });
	}),
};

type Action = ActionType<typeof compositionTimelineAreaActions>;

export const compositionTimelineAreaReducer = (
	state = initialCompositionTimelineAreaState,
	action: Action,
): CompositionTimelineAreaState => {
	switch (action.type) {
		case getType(compositionTimelineAreaActions.setViewBounds): {
			const { viewBounds } = action.payload;
			return { ...state, viewBounds };
		}

		case getType(compositionTimelineAreaActions.setFields): {
			const { fields } = action.payload;
			return { ...state, ...fields };
		}

		default:
			return state;
	}
};
