import { ActionType, createAction, getType } from "typesafe-actions";
import {
	Composition,
	CompositionLayer,
	CompositionLayerProperty,
} from "~/composition/compositionTypes";

export interface CompositionState {
	compositions: {
		[compositionId: string]: Composition;
	};
	layers: {
		[layerId: string]: CompositionLayer;
	};
	properties: {
		[propertyId: string]: CompositionLayerProperty;
	};
	selection: {
		properties: Partial<{ [key: string]: true }>;
	};
}

export const initialCompositionState: CompositionState = {
	compositions: {
		"0": {
			id: "0",
			layers: ["0"],
			frameIndex: 0,
			length: 500,
			width: 400,
			height: 400,
		},
	},
	layers: {
		"0": {
			id: "0",
			name: "Rect",
			index: 10,
			length: 50,
			properties: ["0", "1"],
		},
	},
	properties: {
		"0": {
			timelineId: "0",
			name: "X Position",
			type: "number",
			value: 100,
		},
		"1": {
			timelineId: "1",
			name: "Y Position",
			type: "number",
			value: 50,
		},
	},
	selection: {
		properties: {},
	},
};

export const compositionActions = {
	togglePropertySelection: createAction("compTimeline/TOGGLE_PROPERTY_SELECTED", (action) => {
		return (propertyId: string) => action({ propertyId });
	}),

	clearPropertySelection: createAction("compTimeline/CLEAR_PROPERTY_SELECTED", (action) => {
		return () => action({});
	}),

	setFrameIndex: createAction("compTimeline/SET_FRAME_INDEX", (action) => {
		return (compositionId: string, frameIndex: number) => action({ compositionId, frameIndex });
	}),
};

type Action = ActionType<typeof compositionActions>;

export const compositionReducer = (
	state = initialCompositionState,
	action: Action,
): CompositionState => {
	switch (action.type) {
		case getType(compositionActions.togglePropertySelection): {
			const { propertyId } = action.payload;

			if (state.selection.properties[propertyId]) {
				return {
					...state,
					selection: {
						...state.selection,
						properties: Object.keys(state.selection.properties).reduce<{
							[key: string]: true;
						}>((obj, key) => {
							if (propertyId !== key) {
								obj[key] = true;
							}
							return obj;
						}, {}),
					},
				};
			}

			return {
				...state,
				selection: {
					...state.selection,
					properties: {
						...state.selection.properties,
						[propertyId]: true,
					},
				},
			};
		}

		case getType(compositionActions.clearPropertySelection): {
			return { ...state, selection: { ...state.selection, properties: {} } };
		}

		case getType(compositionActions.setFrameIndex): {
			const { compositionId, frameIndex } = action.payload;
			return {
				...state,
				compositions: {
					...state.compositions,
					[compositionId]: {
						...state.compositions[compositionId],
						frameIndex,
					},
				},
			};
		}

		default:
			return state;
	}
};
