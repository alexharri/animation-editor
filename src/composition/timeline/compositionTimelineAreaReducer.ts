import { ActionType, createAction, getType } from "typesafe-actions";

export interface CompositionTimelineAreaState {
	compositionId: string;
	viewBounds: [number, number];
}

export const initialCompositionTimelineAreaState: CompositionTimelineAreaState = {
	compositionId: "0",
	viewBounds: [0, 1],
};

export const compositionTimelineAreaActions = {
	setViewBounds: createAction("compTimeline/SET_VIEW_BOUNDS", (action) => {
		return (viewBounds: [number, number]) => action({ viewBounds });
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

		default:
			return state;
	}
};
