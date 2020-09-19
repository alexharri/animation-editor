import { Composition } from "~/composition/compositionTypes";
import { AreaType, TIMELINE_CANVAS_END_START_BUFFER } from "~/constants";
import { getGraphEditorYBoundsFromPaths } from "~/graphEditor/graphEditorUtils";
import {
	createGraphEditorNormalToViewport,
	createGraphEditorNormalToViewportX,
	createGraphEditorNormalViewportY,
} from "~/graphEditor/renderGraphEditor";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { Timeline } from "~/timeline/timelineTypes";
import {
	applyTimelineIndexAndValueShifts,
	getSelectedTimelineIdsInComposition,
	timelineKeyframesToPathList,
} from "~/timeline/timelineUtils";
import { MousePosition } from "~/types";
import { interpolate } from "~/util/math";

export interface GraphEditorContext {
	timelines: Timeline[];
	mousePosition: MousePosition;
	compositionId: string;
	composition: Composition;
	timelinePaths: Array<Curve[]>;
	viewBounds: [number, number];
	yBounds: [number, number];
	viewport: Rect;
	areaId: string;
	normalToViewport: (vec: Vec2) => Vec2;
	normalToViewportX: (number: number) => number;
	normalToViewportY: (number: number) => number;
	globalToNormal: (vec: Vec2) => Vec2;
	yFac: number;
}

export const constructGraphEditorContext = (
	globalMousePosition: Vec2,
	areaId: string,
	viewport: Rect,
): GraphEditorContext => {
	const { compositionId, viewBounds } = getAreaActionState<AreaType.Timeline>(areaId);
	const {
		timelineState,
		timelineSelectionState,
		compositionState,
		compositionSelectionState,
	} = getActionState();

	const composition = compositionState.compositions[compositionId];
	const timelineIds = getSelectedTimelineIdsInComposition(
		compositionId,
		compositionState,
		compositionSelectionState,
	);
	const timelines = timelineIds
		.map((timelineId) => timelineState[timelineId])
		.map((timeline) =>
			applyTimelineIndexAndValueShifts(timeline, timelineSelectionState[timeline.id]),
		);

	const timelinePaths = timelines.map((timeline) =>
		timelineKeyframesToPathList(timeline.keyframes),
	);

	const options = {
		height: viewport.height,
		compositionLength: composition.length,
		timelines,
		viewBounds,
		width: viewport.width,
	};
	const normalToViewportX = createGraphEditorNormalToViewportX(options);
	const normalToViewportY = createGraphEditorNormalViewportY(timelinePaths, options);
	const normalToViewport = createGraphEditorNormalToViewport(timelinePaths, options);
	const yFac =
		(normalToViewportX(1) - normalToViewportX(0)) /
		(normalToViewportY(1) - normalToViewportY(0));

	const canvasWidth = viewport.width - TIMELINE_CANVAS_END_START_BUFFER * 2;
	const canvasLeft = viewport.left + TIMELINE_CANVAS_END_START_BUFFER;

	const yBounds = getGraphEditorYBoundsFromPaths(
		viewBounds,
		composition.length,
		timelines,
		timelinePaths,
	);
	const [xMin, xMax] = viewBounds;

	const globalToNormal = (vec: Vec2): Vec2 => {
		const pos = vec.subY(viewport.top).subX(canvasLeft);
		const xt = pos.x / canvasWidth;
		const yt = pos.y / viewport.height;
		pos.x = (xMin + (xMax - xMin) * xt) * composition.length;
		pos.y = interpolate(yBounds[0], yBounds[1], yt);
		return pos;
	};

	const mousePosition: MousePosition = {
		global: globalMousePosition,
		viewport: globalMousePosition.subXY(viewport.left, viewport.top),
		normal: globalToNormal(globalMousePosition),
	};

	const ctx: GraphEditorContext = {
		mousePosition,
		timelines,
		compositionId,
		composition,
		normalToViewport,
		normalToViewportX,
		normalToViewportY,
		globalToNormal,
		viewport,
		areaId,
		timelinePaths,
		viewBounds,
		yBounds,
		yFac,
	};
	return ctx;
};
