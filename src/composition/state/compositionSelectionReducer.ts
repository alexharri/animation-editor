import { ActionType, getType } from "typesafe-actions";
import { compositionActions } from "~/composition/state/compositionReducer";
import { KeySelectionMap } from "~/types";

// Only one composition may be selected at any time.
export interface CompositionSelectionState {
	compositionId: string;
	layers: KeySelectionMap;
	properties: KeySelectionMap;
}

export const initialCompositionSelectionState: CompositionSelectionState = {
	compositionId: "",
	layers: {},
	properties: {},
};

const createNewState = (compositionId: string): CompositionSelectionState => ({
	compositionId,
	layers: {},
	properties: {},
});

type Action = ActionType<typeof compositionActions>;

export const compositionSelectionReducer = (
	state = initialCompositionSelectionState,
	action: Action,
): CompositionSelectionState => {
	switch (action.type) {
		case getType(compositionActions.toggleLayerSelection): {
			const { compositionId, layerId } = action.payload;

			const newState =
				state.compositionId === compositionId
					? { ...state }
					: createNewState(compositionId);

			if (newState.layers[layerId]) {
				newState.layers = Object.keys(newState.layers).reduce<KeySelectionMap>(
					(obj, key) => {
						if (layerId !== key) {
							obj[key] = true;
						}
						return obj;
					},
					{},
				);
				return newState;
			}

			return {
				...newState,
				layers: {
					...newState.layers,
					[layerId]: true,
				},
			};
		}

		case getType(compositionActions.togglePropertySelection): {
			const { compositionId, propertyId } = action.payload;

			const newState =
				state.compositionId === compositionId
					? { ...state }
					: createNewState(compositionId);

			if (newState.properties[propertyId]) {
				newState.properties = Object.keys(newState.properties).reduce<KeySelectionMap>(
					(obj, key) => {
						if (propertyId !== key) {
							obj[key] = true;
						}
						return obj;
					},
					{},
				);
				return newState;
			}

			return {
				...newState,
				properties: {
					...newState.properties,
					[propertyId]: true,
				},
			};
		}

		case getType(compositionActions.clearCompositionSelection): {
			const { compositionId } = action.payload;

			const newState =
				state.compositionId === compositionId
					? { ...state }
					: createNewState(compositionId);

			return { ...newState, properties: {}, layers: {} };
		}

		default:
			return state;
	}
};
