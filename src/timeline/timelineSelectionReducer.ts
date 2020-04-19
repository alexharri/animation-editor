import { ActionType, getType } from "typesafe-actions";
import { timelineActions } from "~/timeline/timelineActions";
import { KeySelectionMap } from "~/types";

type Action = ActionType<typeof timelineActions>;

export interface TimelineSelectionState {
	timelineId: string;
	keyframes: KeySelectionMap;
}

export const initialTimelineSelectionState: TimelineSelectionState = {
	timelineId: "",
	keyframes: {},
};

const createNewState = (timelineId: string): TimelineSelectionState => ({
	timelineId,
	keyframes: {},
});

export function timelineSelectionReducer(
	state: TimelineSelectionState,
	action: Action,
): TimelineSelectionState {
	switch (action.type) {
		case getType(timelineActions.clearSelection): {
			const { timelineId } = action.payload;

			const newState =
				state.timelineId === timelineId ? { ...state } : createNewState(timelineId);

			return {
				...newState,
				keyframes: {},
			};
		}

		case getType(timelineActions.toggleKeyframeSelection): {
			const { timelineId, keyframeId } = action.payload;

			const newState =
				state.timelineId === timelineId ? { ...state } : createNewState(timelineId);

			if (newState.keyframes[keyframeId]) {
				newState.keyframes = Object.keys(newState.keyframes).reduce<KeySelectionMap>(
					(obj, key) => {
						if (keyframeId !== key) {
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
				keyframes: {
					...newState.keyframes,
					[keyframeId]: true,
				},
			};
		}

		default:
			return state;
	}
}
