import { ActionType, getType } from "typesafe-actions";
import { compositionActions } from "~/composition/state/compositionReducer";
import { KeySelectionMap } from "~/types";

// Only one composition may be selected at any time.
export interface CompositionSelectionState {
	compositionId: string;
	properties: KeySelectionMap;
}

export const initialCompositionSelectionState: CompositionSelectionState = {
	compositionId: "",
	properties: {},
};

const createNewState = (compositionId: string): CompositionSelectionState => ({
	compositionId,
	properties: {},
});

type Action = ActionType<typeof compositionActions>;

export const compositionSelectionReducer = (
	state = initialCompositionSelectionState,
	action: Action,
): CompositionSelectionState => {
	switch (action.type) {
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

		case getType(compositionActions.clearPropertySelection): {
			const { compositionId } = action.payload;

			const newState =
				state.compositionId === compositionId
					? { ...state }
					: createNewState(compositionId);

			return { ...newState, properties: {} };
		}

		default:
			return state;
	}
};
