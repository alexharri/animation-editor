import { ActionType, getType } from "typesafe-actions";
import { timelineActions } from "~/timeline/timelineActions";
import { TimelineKeyframe, Timeline } from "~/timeline/timelineTypes";
import { getInsertIndex } from "~/util/alg/getInsertIndex";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";

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
		selection: {
			keyframes: {},
		},
		_yBounds: null,
		_yPan: 0,
		_indexShift: null,
		_valueShift: null,
	},
};

export function timelineReducer(state: TimelineState, action: Action): TimelineState {
	switch (action.type) {
		case getType(timelineActions.addKeyframeToTimeline): {
			const { keyframe, timelineId } = action.payload;

			const timeline = state[timelineId];

			const insertIndex = getInsertIndex(
				timeline.keyframes,
				keyframe,
				(a, b) => a.index - b.index,
			);

			const keyframes = [...timeline.keyframes];
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

		case getType(timelineActions.submitIndexAndValueShift): {
			const { timelineId } = action.payload;
			const timeline = applyTimelineIndexAndValueShifts(state[timelineId]);
			return {
				...state,
				[timelineId]: timeline,
			};
		}

		case getType(timelineActions.clearSelection): {
			const { timelineId } = action.payload;
			return {
				...state,
				[timelineId]: {
					...state[timelineId],
					selection: {
						keyframes: {},
					},
				},
			};
		}

		case getType(timelineActions.toggleKeyframeSelection): {
			const { timelineId, keyframeId } = action.payload;

			if (state[timelineId].selection.keyframes[keyframeId]) {
				return {
					...state,
					[timelineId]: {
						...state[timelineId],
						selection: {
							...state[timelineId].selection,
							keyframes: Object.keys(state[timelineId].selection.keyframes).reduce<{
								[key: string]: true;
							}>((obj, key) => {
								if (key !== keyframeId) {
									obj[key] = true;
								}
								return obj;
							}, {}),
						},
					},
				};
			}

			return {
				...state,
				[timelineId]: {
					...state[timelineId],
					selection: {
						...state[timelineId].selection,
						keyframes: {
							...state[timelineId].selection.keyframes,
							[keyframeId]: true,
						},
					},
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
