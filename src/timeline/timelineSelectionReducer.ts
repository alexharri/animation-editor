import { ActionType, getType } from "typesafe-actions";
import { timelineActions } from "~/timeline/timelineActions";
import { KeySelectionMap } from "~/types";

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

			return Object.keys(state).reduce<TimelineSelectionState>((obj, key) => {
				if (key !== timelineId) {
					obj[key] = state[key];
				}
				return obj;
			}, {});
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

		// case getType(timelineActions.setDragSelectRect): {
		// 	const { timelineId, rect } = action.payload;
		// 	return {
		// 		...state,
		// 		timelineId,
		// 		_dragSelectRect: rect,
		// 	};
		// }

		// case getType(timelineActions.submitDragSelectRect): {
		// 	const { timelineId, additiveSelection } = action.payload;

		// 	return {
		// 		...state,
		// 		keyframes: Object.keys(state.nodes).reduce<{ [key: string]: true }>((obj, key) => {
		// 					const node = state.nodes[key];
		// 					const shouldBeSelected =
		// 						(additiveSelection && state.selection.nodes[key]) ||
		// 						rectsIntersect(state._dragSelectRect!, {
		// 							left: node.position.x,
		// 							top: node.position.y,
		// 							height: calculateNodeHeight(node),
		// 							width: node.width,
		// 						});

		// 					if (shouldBeSelected) {
		// 						obj[key] = true;
		// 					}

		// 					return obj;
		// 				}, {}),
		// 		_dragSelectRect: null,
		// 	};
		// }

		default:
			return state;
	}
}
