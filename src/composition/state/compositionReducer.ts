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
			type: "rect",
			name: "Rect",
			index: 10,
			length: 50,
			properties: ["0", "1", "2", "3"],
		},
	},
	properties: {
		"0": {
			id: "0",
			name: "x",
			timelineId: "0",
			label: "X Position",
			type: "number",
			value: 100,
		},
		"1": {
			id: "1",
			name: "y",
			timelineId: "",
			label: "Y Position",
			type: "number",
			value: 50,
		},
		"2": {
			id: "2",
			name: "width",
			timelineId: "",
			label: "Width",
			type: "number",
			value: 200,
			min: 0,
		},
		"3": {
			id: "3",
			name: "height",
			timelineId: "",
			label: "Height",
			type: "number",
			value: 75,
			min: 0,
		},
	},
};

export const compositionActions = {
	togglePropertySelection: createAction("compTimeline/TOGGLE_PROPERTY_SELECTED", (action) => {
		return (compositionId: string, propertyId: string) => action({ compositionId, propertyId });
	}),

	clearPropertySelection: createAction("compTimeline/CLEAR_PROPERTY_SELECTED", (action) => {
		return (compositionId: string) => action({ compositionId });
	}),

	setFrameIndex: createAction("compTimeline/SET_FRAME_INDEX", (action) => {
		return (compositionId: string, frameIndex: number) => action({ compositionId, frameIndex });
	}),

	setPropertyValue: createAction("compTimeline/SET_PROPERTY_VALUE", (action) => {
		return (propertyId: string, value: number) => action({ propertyId, value });
	}),
};

type Action = ActionType<typeof compositionActions>;

export const compositionReducer = (
	state = initialCompositionState,
	action: Action,
): CompositionState => {
	switch (action.type) {
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

		case getType(compositionActions.setPropertyValue): {
			const { propertyId, value } = action.payload;
			return {
				...state,
				properties: {
					...state.properties,
					[propertyId]: {
						...state.properties[propertyId],
						value,
					},
				},
			};
		}

		default:
			return state;
	}
};
