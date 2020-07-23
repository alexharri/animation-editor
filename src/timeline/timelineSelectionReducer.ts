import { ActionType, getType } from "typesafe-actions";
import { timelineActions } from "~/timeline/timelineActions";
import { KeySelectionMap } from "~/types";
import { removeKeysFromMap } from "~/util/mapUtils";

type Action = ActionType<typeof timelineActions>;

export interface TimelineSelection {
	timelineId: string;
	keyframes: KeySelectionMap;
}

export type TimelineSelectionState = Partial<{
	[timelineId: string]: TimelineSelection;
}>;

export const initialTimelineSelectionState: TimelineSelectionState = {};

export function timelineSelectionReducer(
	state: TimelineSelectionState,
	action: Action,
): TimelineSelectionState {
	switch (action.type) {
		case getType(timelineActions.clearSelection): {
			const { timelineId } = action.payload;
			return removeKeysFromMap(state, [timelineId]);
		}

		case getType(timelineActions.toggleKeyframeSelection): {
			const { timelineId, keyframeId } = action.payload;

			const newState = { ...state };

			if (!newState[timelineId]) {
				newState[timelineId] = {
					timelineId,
					keyframes: {},
				};
			}

			const newTimeline = { ...newState[timelineId]! };

			if (newTimeline.keyframes[keyframeId]) {
				newTimeline.keyframes = Object.keys(newTimeline.keyframes).reduce<KeySelectionMap>(
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
				[timelineId]: {
					...newTimeline,
					keyframes: {
						...newTimeline.keyframes,
						[keyframeId]: true,
					},
				},
			};
		}

		case getType(timelineActions.addKeyframesToSelection): {
			const { timelineId, keyframeIds } = action.payload;
			return {
				...state,
				[timelineId]: {
					timelineId,
					keyframes: {
						...state[timelineId]?.keyframes,
						...keyframeIds.reduce<KeySelectionMap>((obj, key) => {
							obj[key] = true;
							return obj;
						}, {}),
					},
				},
			};
		}

		default:
			return state;
	}
}
