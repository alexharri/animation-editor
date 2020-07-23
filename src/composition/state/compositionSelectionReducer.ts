import { ActionType, createAction, getType } from "typesafe-actions";
import { CompositionSelection } from "~/composition/compositionTypes";
import { KeySelectionMap } from "~/types";
import { removeKeysFromMap } from "~/util/mapUtils";

export const compositionSelectionActions = {
	toggleLayerSelection: createAction("comp/TOGGLE_LAYER_SELECTED", (action) => {
		return (compositionId: string, layerId: string) => action({ compositionId, layerId });
	}),

	removeLayersFromSelection: createAction("comp/REMOVE_LAYER_SELECTED", (action) => {
		return (compositionId: string, layerIds: string[]) => action({ compositionId, layerIds });
	}),

	togglePropertySelection: createAction("comp/TOGGLE_PROPERTY_SELECTED", (action) => {
		return (compositionId: string, propertyId: string) => action({ compositionId, propertyId });
	}),

	clearCompositionSelection: createAction("comp/CLEAR_COMP_SELECTION", (action) => {
		return (compositionId: string) => action({ compositionId });
	}),
};

// Only one composition may be selected at any time.
export interface CompositionSelectionState {
	[compositionId: string]: CompositionSelection;
}

export const initialCompositionSelectionState: CompositionSelectionState = {};

const createNewCompSelection = (): CompositionSelection => ({
	layers: {},
	properties: {},
});

type Action = ActionType<typeof compositionSelectionActions>;

const singleCompositionSelectionReducer = (
	state: CompositionSelection,
	action: Action,
): CompositionSelection => {
	switch (action.type) {
		case getType(compositionSelectionActions.toggleLayerSelection): {
			const { layerId } = action.payload;

			if (state.layers[layerId]) {
				state.layers = Object.keys(state.layers).reduce<KeySelectionMap>((obj, key) => {
					if (layerId !== key) {
						obj[key] = true;
					}
					return obj;
				}, {});
				return state;
			}

			return {
				...state,
				layers: {
					...state.layers,
					[layerId]: true,
				},
			};
		}

		case getType(compositionSelectionActions.removeLayersFromSelection): {
			const { layerIds } = action.payload;

			return {
				...state,
				layers: removeKeysFromMap(state.layers, layerIds),
			};
		}

		case getType(compositionSelectionActions.togglePropertySelection): {
			const { propertyId } = action.payload;

			if (state.properties[propertyId]) {
				state.properties = Object.keys(state.properties).reduce<KeySelectionMap>(
					(obj, key) => {
						if (propertyId !== key) {
							obj[key] = true;
						}
						return obj;
					},
					{},
				);
				return state;
			}

			return {
				...state,
				properties: {
					...state.properties,
					[propertyId]: true,
				},
			};
		}

		case getType(compositionSelectionActions.clearCompositionSelection): {
			return { ...state, properties: {}, layers: {} };
		}

		default:
			return state;
	}
};

export const compositionSelectionReducer = (
	state = initialCompositionSelectionState,
	action: Action,
): CompositionSelectionState => {
	const compositionId = action.payload.compositionId;
	const selection = state[compositionId] || createNewCompSelection();

	return {
		...state,
		[compositionId]: singleCompositionSelectionReducer(selection, action),
	};
};
