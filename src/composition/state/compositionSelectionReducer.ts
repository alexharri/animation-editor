import { ActionType, createAction, getType } from "typesafe-actions";
import { CompositionSelection } from "~/composition/compositionTypes";
import { removeKeysFromMap } from "~/util/mapUtils";

export const compSelectionActions = {
	toggleLayerSelection: createAction("comp/TOGGLE_LAYER_SELECTED", (action) => {
		return (compositionId: string, layerId: string) => action({ compositionId, layerId });
	}),

	removeLayersFromSelection: createAction("comp/REMOVE_LAYERS", (action) => {
		return (compositionId: string, layerIds: string[]) => action({ compositionId, layerIds });
	}),

	removePropertiesFromSelection: createAction("comp/REMOVE_PROPERTIES", (action) => {
		return (compositionId: string, propertyIds: string[]) =>
			action({ compositionId, propertyIds });
	}),

	togglePropertySelection: createAction("comp/TOGGLE_PROPERTY_SELECTED", (action) => {
		return (compositionId: string, propertyId: string) => action({ compositionId, propertyId });
	}),

	clearCompositionSelection: createAction("comp/CLEAR_COMP_SELECTION", (action) => {
		return (compositionId: string) => action({ compositionId });
	}),

	addPropertyToSelection: createAction("comp/ADD_PROP_TO_SELECTION", (action) => {
		return (compositionId: string, propertyId: string) => action({ compositionId, propertyId });
	}),

	addLayerToSelection: createAction("comp/ADD_LAYER_TO_SELECTION", (action) => {
		return (compositionId: string, layerId: string) => action({ compositionId, layerId });
	}),
};

export interface CompositionSelectionState {
	[compositionId: string]: CompositionSelection;
}

export const initialCompositionSelectionState: CompositionSelectionState = {};

const createNewCompSelection = (): CompositionSelection => ({
	layers: {},
	properties: {},
});

type Action = ActionType<typeof compSelectionActions>;

const singleCompositionSelectionReducer = (
	state: CompositionSelection,
	action: Action,
): CompositionSelection => {
	switch (action.type) {
		case getType(compSelectionActions.toggleLayerSelection): {
			const { layerId } = action.payload;

			return {
				...state,
				layers: state.layers[layerId]
					? removeKeysFromMap(state.layers, [layerId])
					: {
							...state.layers,
							[layerId]: true,
					  },
			};
		}

		case getType(compSelectionActions.removeLayersFromSelection): {
			const { layerIds } = action.payload;

			return {
				...state,
				layers: removeKeysFromMap(state.layers, layerIds),
			};
		}

		case getType(compSelectionActions.removePropertiesFromSelection): {
			const { propertyIds } = action.payload;

			return {
				...state,
				properties: removeKeysFromMap(state.properties, propertyIds),
			};
		}

		case getType(compSelectionActions.togglePropertySelection): {
			const { propertyId } = action.payload;

			return {
				...state,
				properties: state.properties[propertyId]
					? removeKeysFromMap(state.properties, [propertyId])
					: {
							...state.properties,
							[propertyId]: true,
					  },
			};
		}

		case getType(compSelectionActions.clearCompositionSelection): {
			return { ...state, properties: {}, layers: {} };
		}

		case getType(compSelectionActions.addPropertyToSelection): {
			const { propertyId } = action.payload;
			return {
				...state,
				properties: {
					...state.properties,
					[propertyId]: true,
				},
			};
		}

		case getType(compSelectionActions.addLayerToSelection): {
			const { layerId } = action.payload;
			return {
				...state,
				layers: {
					...state.layers,
					[layerId]: true,
				},
			};
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
