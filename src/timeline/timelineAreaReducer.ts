import { ActionType, createAction, getType } from "typesafe-actions";

export interface TimelineAreaState {
	compositionId: string;
	graphEditorOpen: boolean;
	viewBounds: [number, number];
	panY: number;
	dragSelectRect: Rect | null;
	trackDragSelectRect: Rect | null;
	layerIndexShift: number;
	layerLengthShift: [number, number];
	moveLayers: null | { layerId: string; type: "above" | "below" | "invalid" };
}

export const initialTimelineAreaState: TimelineAreaState = {
	compositionId: "",
	graphEditorOpen: false,
	viewBounds: [0, 1],
	panY: 0,
	dragSelectRect: null,
	trackDragSelectRect: null,
	layerIndexShift: 0,
	layerLengthShift: [0, 0],
	moveLayers: null,
};

export const timelineAreaActions = {
	setViewBounds: createAction("timeline/SET_VIEW_BOUNDS", (action) => {
		return (viewBounds: [number, number]) => action({ viewBounds });
	}),

	setPanY: createAction("timeline/SET_PAN_Y", (action) => {
		return (panY: number) => action({ panY });
	}),

	setFields: createAction("timeline/SET_FIELDS", (action) => {
		return (fields: Partial<TimelineAreaState>) => action({ fields });
	}),

	toggleGraphEditorOpen: createAction("timeline/SET_GRAPH_OPEN", (action) => {
		return () => action({});
	}),
};

type Action = ActionType<typeof timelineAreaActions>;

export const timelineAreaReducer = (
	state = initialTimelineAreaState,
	action: Action,
): TimelineAreaState => {
	switch (action.type) {
		case getType(timelineAreaActions.setViewBounds): {
			const { viewBounds } = action.payload;
			return { ...state, viewBounds };
		}

		case getType(timelineAreaActions.setPanY): {
			const { panY } = action.payload;
			return { ...state, panY };
		}

		case getType(timelineAreaActions.setFields): {
			const { fields } = action.payload;
			return { ...state, ...fields };
		}

		case getType(timelineAreaActions.toggleGraphEditorOpen): {
			return { ...state, graphEditorOpen: !state.graphEditorOpen };
		}

		default:
			return state;
	}
};
