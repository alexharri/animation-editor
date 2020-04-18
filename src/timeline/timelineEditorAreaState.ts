import { ActionType, getType, createAction } from "typesafe-actions";

export interface TimelineEditorAreaState {
	timelineId: string;
	viewBounds: [number, number];
}

export const initialTimelineAreaState: TimelineEditorAreaState = {
	timelineId: "0",
	viewBounds: [0.2, 1],
};

export const timelineEditorAreaActions = {
	setViewBounds: createAction("timelineEditorAreaState/SET_VIEW_BOUNDS", (action) => {
		return (viewBounds: [number, number]) => action({ viewBounds });
	}),

	// toggleGraphEditorOpen: createAction(
	// 	"timelineEditorAreaState/TOGGLE_GRAPH_EDITOR_OPEN",
	// 	(action) => {
	// 		return () => action({});
	// 	},
	// ),
};

type Action = ActionType<typeof timelineEditorAreaActions>;

export const timelineEditorAreaReducer = (
	state = initialTimelineAreaState,
	action: Action,
): TimelineEditorAreaState => {
	switch (action.type) {
		case getType(timelineEditorAreaActions.setViewBounds): {
			const { viewBounds } = action.payload;
			return { ...state, viewBounds };
		}

		// case getType(timelineEditorAreaActions.toggleGraphEditorOpen): {
		// 	return { ...state, isGraphEditor: !state.isGraphEditor };
		// }

		default:
			return state;
	}
};
