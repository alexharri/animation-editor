import { ActionType, createAction, getType } from "typesafe-actions";

export interface CompTimeAreaState {
	compositionId: string;
	graphEditorOpen: boolean;
	viewBounds: [number, number];
	dragSelectRect: Rect | null;
}

export const initialCompTimeAreaState: CompTimeAreaState = {
	compositionId: "0",
	graphEditorOpen: false,
	viewBounds: [0, 1],
	dragSelectRect: null,
};

export const compTimeAreaActions = {
	setViewBounds: createAction("compTime/SET_VIEW_BOUNDS", (action) => {
		return (viewBounds: [number, number]) => action({ viewBounds });
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
