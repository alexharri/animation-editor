import { ActionType, createAction } from "typesafe-actions";

export interface TimelineEditorAreaState {
	timelineId: string;
}

export const initialTimelineAreaState: TimelineEditorAreaState = {
	timelineId: "0",
};

export const timelineEditorAreaActions = {
	setViewBounds: createAction("timelineEditorAreaState/SET_VIEW_BOUNDS", (action) => {
		return (viewBounds: [number, number]) => action({ viewBounds });
	}),
};

type Action = ActionType<typeof timelineEditorAreaActions>;

export const timelineEditorAreaReducer = (
	state = initialTimelineAreaState,
	action: Action,
): TimelineEditorAreaState => {
	switch (action.type) {
		// case getType(timelineEditorAreaActions.toggleGraphEditorOpen): {
		// 	return { ...state, isGraphEditor: !state.isGraphEditor };
		// }

		default:
			return state;
	}
};
