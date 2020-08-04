import { ActionType, createAction, getType } from "typesafe-actions";

export interface CompTimeAreaState {
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

export const initialCompTimeAreaState: CompTimeAreaState = {
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

export const compTimeAreaActions = {
	setViewBounds: createAction("compTime/SET_VIEW_BOUNDS", (action) => {
		return (viewBounds: [number, number]) => action({ viewBounds });
	}),

	setPanY: createAction("compTime/SET_PAN_Y", (action) => {
		return (panY: number) => action({ panY });
	}),

	setFields: createAction("compTime/SET_FIELDS", (action) => {
		return (fields: Partial<CompTimeAreaState>) => action({ fields });
	}),

	toggleGraphEditorOpen: createAction("compTime/SET_GRAPH_OPEN", (action) => {
		return () => action({});
	}),
};

type Action = ActionType<typeof compTimeAreaActions>;

export const compTimeAreaReducer = (
	state = initialCompTimeAreaState,
	action: Action,
): CompTimeAreaState => {
	switch (action.type) {
		case getType(compTimeAreaActions.setViewBounds): {
			const { viewBounds } = action.payload;
			return { ...state, viewBounds };
		}

		case getType(compTimeAreaActions.setPanY): {
			const { panY } = action.payload;
			return { ...state, panY };
		}

		case getType(compTimeAreaActions.setFields): {
			const { fields } = action.payload;
			return { ...state, ...fields };
		}

		case getType(compTimeAreaActions.toggleGraphEditorOpen): {
			return { ...state, graphEditorOpen: !state.graphEditorOpen };
		}

		default:
			return state;
	}
};
