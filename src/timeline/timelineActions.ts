import { createAction } from "typesafe-actions";
import { TimelineSelection } from "~/timeline/timelineSelectionReducer";
import { Timeline, TimelineKeyframe, TimelineKeyframeControlPoint } from "~/timeline/timelineTypes";

export const timelineActions = {
	setTimeline: createAction("timeline/SET_TIMELINE", (resolve) => {
		return (timelineId: string, timeline: Timeline) => resolve({ timelineId, timeline });
	}),

	removeTimeline: createAction("timeline/REMOVE_TIMELINE", (resolve) => {
		return (timelineId: string) => resolve({ timelineId });
	}),

	setKeyframe: createAction("timeline/SET_KEYFRAME", (resolve) => {
		return (timelineId: string, keyframe: TimelineKeyframe) =>
			resolve({ timelineId, keyframe });
	}),

	removeKeyframes: createAction("timeline/REMOVE_KEYFRAMES", (action) => {
		return (timelineId: string, keyframeIds: string[]) => action({ timelineId, keyframeIds });
	}),

	setDragSelectRect: createAction("timeline/SET_DRAG_SELECT_RECT", (resolve) => {
		return (timelineId: string, rect: Rect) => resolve({ timelineId, rect });
	}),

	submitDragSelectRect: createAction("timeline/SUBMIT_DRAG_SELECT", (action) => {
		return (timelineId: string, additiveSelection: boolean) =>
			action({ timelineId, additiveSelection });
	}),

	setIndexAndValueShift: createAction("timeline/SET_SHIFT", (resolve) => {
		return (timelineId: string, indexShift: number, valueShift: number) =>
			resolve({ timelineId, indexShift, valueShift });
	}),

	setControlPointShift: createAction("timeline/SET_CP_SHIFT", (resolve) => {
		return (timelineId: string, controlPointShift: Timeline["_controlPointShift"]) =>
			resolve({ timelineId, controlPointShift });
	}),

	setNewControlPointShift: createAction("timeline/SET_NEW_CP_SHIFT", (resolve) => {
		return (timelineId: string, newControlPointShift: Timeline["_newControlPointShift"]) =>
			resolve({ timelineId, newControlPointShift });
	}),

	applyControlPointShift: createAction("timeline/APPLY_CP_SHIFT", (resolve) => {
		return (timelineId: string, selection: TimelineSelection | undefined) =>
			resolve({ timelineId, selection });
	}),

	submitIndexAndValueShift: createAction("timeline/SUBMIT_SHIFT", (resolve) => {
		return (timelineId: string, selection: TimelineSelection) =>
			resolve({ timelineId, selection });
	}),

	shiftTimelineIndex: createAction("timeline/SHIFT_TIMELINE_INDEX", (resolve) => {
		return (timelineId: string, shiftBy: number) => resolve({ timelineId, shiftBy });
	}),

	setYBounds: createAction("timeline/SET_Y_BOUNDS", (resolve) => {
		return (timelineId: string, yBounds: [number, number] | null) =>
			resolve({ timelineId, yBounds });
	}),

	setYPan: createAction("timeline/SET_Y_PAN", (resolve) => {
		return (timelineId: string, yPan: number) => resolve({ timelineId, yPan });
	}),

	setKeyframeReflectControlPoints: createAction(
		"timeline/SET_KEYFRAME_REFLECT_CONTROL_POINTS",
		(resolve) => {
			return (timelineId: string, keyframeIndex: number, reflectControlPoints: boolean) =>
				resolve({ timelineId, keyframeIndex, reflectControlPoints });
		},
	),

	setKeyframeControlPoint: createAction("timeline/SET_KEYFRAME_CONTROL_POINT", (resolve) => {
		return (
			timelineId: string,
			keyframeIndex: number,
			direction: "left" | "right",
			controlPoint: TimelineKeyframeControlPoint | null,
		) => resolve({ timelineId, controlPoint, keyframeIndex, direction });
	}),
};

export const timelineSelectionActions = {
	addKeyframes: createAction("timeline_selection/ADD_KEYFRAMES", (action) => {
		return (timelineId: string, keyframeIds: string[]) => action({ timelineId, keyframeIds });
	}),

	removeKeyframes: createAction("timeline_selection/REMOVE_KEYFRAMES", (action) => {
		return (timelineId: string, keyframeIds: string[]) => action({ timelineId, keyframeIds });
	}),

	toggleKeyframe: createAction("timeline_selection/TOGGLE_KEYFRAME_SELECTION", (resolve) => {
		return (timelineId: string, keyframeId: string) => resolve({ timelineId, keyframeId });
	}),

	clear: createAction("timeline_selection/CLEAR_SELECTION", (resolve) => {
		return (timelineId: string) => resolve({ timelineId });
	}),
};
