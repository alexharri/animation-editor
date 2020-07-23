import { ActionType, getType } from "typesafe-actions";
import { timelineActions } from "~/timeline/timelineActions";
import { Timeline, TimelineKeyframe } from "~/timeline/timelineTypes";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";
import { getInsertIndex } from "~/util/alg/getInsertIndex";

type Action = ActionType<typeof timelineActions>;

export interface TimelineState {
	[timelineId: string]: Timeline;
}

export const initialTimelineState: TimelineState = {
	0: {
		id: "0",
		keyframes: [
			{
				id: "0",
				index: 40,
				value: 40,
				reflectControlPoints: false,
				controlPointLeft: null,
				controlPointRight: null,
			},
			{
				id: "1",
				index: 50,
				value: 50,
				reflectControlPoints: false,
				controlPointLeft: null,
				controlPointRight: null,
			},
			{
				id: "2",
				index: 75,
				value: 75,
				reflectControlPoints: false,
				controlPointLeft: null,
				controlPointRight: { tx: 0.2, value: 10 },
			},
			{
				id: "3",
				index: 150,
				value: 200,
				reflectControlPoints: false,
				controlPointLeft: { tx: 0.5, value: -20 },
				controlPointRight: { value: 10, tx: 0.5 },
			}, // tslint:disable-line
			{
				id: "4",
				index: 200,
				value: 100,
				reflectControlPoints: false,
				controlPointLeft: { tx: 0.75, value: 50 },
				controlPointRight: null,
			},
		].map<TimelineKeyframe>((keyframe, i, keyframes) => {
			const k: TimelineKeyframe = { ...keyframe } as any;
			if (k.controlPointLeft && keyframes[i - 1]) {
				k.controlPointLeft = {
					...k.controlPointLeft,
					relativeToDistance: k.index - keyframes[i - 1].index,
				};
			}
			if (k.controlPointRight && keyframes[i + 1]) {
				k.controlPointRight = {
					...k.controlPointRight,
					relativeToDistance: keyframes[i + 1].index - k.index,
				};
			}
			return k;
		}),
		_yBounds: null,
		_yPan: 0,
		_indexShift: null,
		_valueShift: null,
		_dragSelectRect: null,
		_controlPointShift: null,
		_newControlPointShift: null,
	},
};

export function timelineReducer(state: TimelineState, action: Action): TimelineState {
	switch (action.type) {
		case getType(timelineActions.setTimeline): {
			const { timeline, timelineId } = action.payload;
			return {
				...state,
				[timelineId]: timeline,
			};
		}

		case getType(timelineActions.removeTimeline): {
			const { timelineId } = action.payload;
			return Object.keys(state).reduce<TimelineState>((obj, key) => {
				if (key !== timelineId) {
					obj[key] = state[key];
				}
				return obj;
			}, {});
		}

		case getType(timelineActions.setKeyframe): {
			const { keyframe, timelineId } = action.payload;

			const timeline = state[timelineId];
			const keyframes = [...timeline.keyframes];
			const keyframeIds = keyframes.map((k) => k.id);

			const currentIndex = keyframeIds.indexOf(keyframe.id);
			if (currentIndex !== -1) {
				keyframes.splice(currentIndex, 1);
			}

			const indexOfKeyframeAtIndex = keyframes.map((k) => k.index).indexOf(keyframe.index);
			if (indexOfKeyframeAtIndex !== -1) {
				keyframes.splice(indexOfKeyframeAtIndex, 1);
			}

			const insertIndex = getInsertIndex(keyframes, keyframe, (a, b) => a.index - b.index);
			keyframes.splice(insertIndex, 0, keyframe);

			return {
				...state,
				[timelineId]: {
					...timeline,
					keyframes,
				},
			};
		}

		case getType(timelineActions.setYPan): {
			const { timelineId, yPan } = action.payload;

			return {
				...state,
				[timelineId]: {
					...state[timelineId],
					_yPan: yPan,
				},
			};
		}

		case getType(timelineActions.setYBounds): {
			const { timelineId, yBounds } = action.payload;

			return {
				...state,
				[timelineId]: {
					...state[timelineId],
					_yBounds: yBounds,
				},
			};
		}

		case getType(timelineActions.setIndexAndValueShift): {
			const { timelineId, indexShift, valueShift } = action.payload;
			return {
				...state,
				[timelineId]: {
					...state[timelineId],
					_indexShift: indexShift,
					_valueShift: valueShift,
				},
			};
		}

		case getType(timelineActions.setControlPointShift): {
			const { timelineId, controlPointShift } = action.payload;
			return {
				...state,
				[timelineId]: {
					...state[timelineId],
					_controlPointShift: controlPointShift,
				},
			};
		}

		case getType(timelineActions.setNewControlPointShift): {
			const { timelineId, newControlPointShift } = action.payload;
			return {
				...state,
				[timelineId]: {
					...state[timelineId],
					_newControlPointShift: newControlPointShift,
				},
			};
		}

		case getType(timelineActions.applyControlPointShift): {
			const { timelineId, selection } = action.payload;
			return {
				...state,
				[timelineId]: applyTimelineIndexAndValueShifts(state[timelineId], selection),
			};
		}

		case getType(timelineActions.submitIndexAndValueShift): {
			const { timelineId, selection } = action.payload;
			const timeline = applyTimelineIndexAndValueShifts(state[timelineId], selection);
			return {
				...state,
				[timelineId]: timeline,
			};
		}

		case getType(timelineActions.shiftTimelineIndex): {
			const { timelineId, shiftBy } = action.payload;
			const timeline = state[timelineId];
			return {
				...state,
				[timelineId]: {
					...timeline,
					keyframes: timeline.keyframes.map((k) => ({
						...k,
						index: k.index + shiftBy,
					})),
				},
			};
		}

		case getType(timelineActions.setKeyframeReflectControlPoints): {
			const { timelineId, keyframeIndex, reflectControlPoints } = action.payload;

			const timeline = state[timelineId];

			return {
				...state,
				[timelineId]: {
					...timeline,
					keyframes: timeline.keyframes.map((keyframe, index) => {
						if (keyframeIndex !== index) {
							return keyframe;
						}

						return { ...keyframe, reflectControlPoints };
					}),
				},
			};
		}

		case getType(timelineActions.setKeyframeControlPoint): {
			const { timelineId, keyframeIndex, controlPoint, direction } = action.payload;
			const newKeyframe: TimelineKeyframe = { ...state[timelineId].keyframes[keyframeIndex] };

			if (direction === "right") {
				newKeyframe.controlPointRight = controlPoint;
			} else {
				newKeyframe.controlPointLeft = controlPoint;
			}

			const timeline = state[timelineId];

			return {
				...state,
				[timelineId]: {
					...timeline,
					keyframes: timeline.keyframes.map((keyframe, index) => {
						if (keyframeIndex !== index) {
							return keyframe;
						}

						return newKeyframe;
					}),
				},
			};
		}

		default:
			return state;
	}
}
