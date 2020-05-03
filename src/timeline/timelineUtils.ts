import Bezier from "bezier-easing";
import uuid from "uuid/v4";

export const calcP2 = (p3: Vec2, p1: Vec2): Vec2 => {
	return Vec2.new(p1.x + (p3.x - p1.x) * 0.4, p1.y + (p3.y - p1.y) * 0.4);
};

function quadraticToCubicBezier(bezier: PartialCubicBezier): CubicBezier {
	const [p0, p1, p2, p3] = bezier;
	if (!p1) {
		const newP1 = calcP2(p2!, p0);
		return [p0, newP1, p2!, p3];
	} else {
		const newP2 = calcP2(p1!, p3);
		return [p0, p1, newP2, p3];
	}
}

export const getControlPointAsVector = (
	whichControlPoint: "cp0" | "cp1",
	k0: TimelineKeyframe,
	k1: TimelineKeyframe,
): Vec2 | null => {
	const k = whichControlPoint === "cp0" ? k0 : k1;
	const cp = whichControlPoint === "cp0" ? k.controlPointRight : k.controlPointLeft;

	if (!cp) {
		return null;
	}

	const t = (k1.index - k0.index) / cp.relativeToDistance;
	return Vec2.new(interpolate(k0.index, k1.index, cp.tx), k.value + cp.value * t);
};
import { TimelineKeyframe, Timeline } from "~/timeline/timelineTypes";
import { interpolate } from "~/util/math";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { getActionState } from "~/state/stateUtils";
import { splitCubicBezier } from "~/util/math/splitCubicBezier";
import { intersectCubicBezierLine } from "~/util/math/intersection/intersectBezier3Line";

const getPathFromKeyframes = (k0: TimelineKeyframe, k1: TimelineKeyframe): CubicBezier | Line => {
	if (k0.controlPointRight && k1.controlPointLeft) {
		const p0 = Vec2.new(k0.index, k0.value);
		const p1 = getControlPointAsVector("cp0", k0, k1)!;
		const p2 = getControlPointAsVector("cp1", k0, k1)!;
		const p3 = Vec2.new(k1.index, k1.value);
		return [p0, p1, p2, p3];
	}

	if (k0.controlPointRight || k1.controlPointLeft) {
		const p0 = Vec2.new(k0.index, k0.value);
		const p1 = getControlPointAsVector("cp0", k0, k1);
		const p2 = getControlPointAsVector("cp1", k0, k1);
		const p3 = Vec2.new(k1.index, k1.value);
		return quadraticToCubicBezier([p0, p1, p2, p3]);
	}

	const p0 = Vec2.new(k0.index, k0.value);
	const p3 = Vec2.new(k1.index, k1.value);
	return [p0, p3];
};

export const timelineKeyframesToPathList = (
	keyframes: TimelineKeyframe[],
): Array<CubicBezier | Line> => {
	const paths: Array<CubicBezier | Line> = [];

	for (let i = 0; i < keyframes.length - 1; i += 1) {
		const k0 = keyframes[i];
		const k1 = keyframes[i + 1];
		paths.push(getPathFromKeyframes(k0, k1));
	}

	return paths;
};

export function getTimelineValueAtIndex(timeline: Timeline, index: number): number {
	const keyframes = timeline.keyframes;

	if (keyframes.length < 1) {
		throw new Error("Timeline must have at least one keyframe");
	}

	if (keyframes.length === 1 || keyframes[0].index > index) {
		return keyframes[0].value;
	}

	if (keyframes[keyframes.length - 1].index < index) {
		return keyframes[keyframes.length - 1].value;
	}

	for (let i = 0; i < keyframes.length; i += 1) {
		if (keyframes[i].index > index) {
			continue;
		}

		if (keyframes[i].index === index) {
			return keyframes[i].value;
		}

		if (index > keyframes[i + 1].index) {
			continue;
		}

		const k0 = keyframes[i];
		const k1 = keyframes[i + 1];
		const path = getPathFromKeyframes(k0, k1);
		const linearT = (index - k0.index) / (k1.index - k0.index);

		if (path.length === 2) {
			return interpolate(path[0].y, path[1].y, linearT);
		}

		const xDiff = path[3].x - path[0].x;
		const yDiff = path[3].y - path[0].y;

		const x1 = (path[1].x - path[0].x) / xDiff;
		const y1 = (path[1].y - path[0].y) / yDiff;
		const x2 = (path[2].x - path[0].x) / xDiff;
		const y2 = (path[2].y - path[0].y) / yDiff;

		return interpolate(path[0].y, path[3].y, Bezier(x1, y1, x2, y2)(linearT));
	}

	return 0 as never;
}

export const getTimelineYBoundsFromPaths = (paths: Array<CubicBezier | Line>): [number, number] => {
	let yUpper = -Infinity;
	let yLower = Infinity;

	for (let i = 0; i < paths.length; i += 1) {
		for (let j = 0; j < paths[i].length; j += 1) {
			const vec = paths[i][j];
			if (yUpper < vec.y) {
				yUpper = vec.y;
			}
			if (yLower > vec.y) {
				yLower = vec.y;
			}
		}
	}

	const diff = yUpper - yLower;

	return [yUpper + diff * 0.1, yLower - diff * 0.1];
};

export const transformGlobalToTimelineX = (
	vecX: number,
	viewBounds: [number, number],
	left: number,
	width: number,
	length: number,
): number => {
	const xt = (vecX - left) / width;
	const [xMin, xMax] = viewBounds;
	return (xMin + (xMax - xMin) * xt) * length;
};

export const transformGlobalToTimelinePosition = (
	vec: Vec2,
	options: {
		length: number;
		timeline: Timeline;
		viewBounds: [number, number];
		viewport: Rect;
	},
): Vec2 => {
	const { timeline, viewBounds, viewport } = options;

	let pos = vec.subY(viewport.top).subX(viewport.left);

	const xt = pos.x / viewport.width;
	const yt = pos.y / viewport.height;

	const paths = timelineKeyframesToPathList(timeline.keyframes);
	const [yUp, yLow] = getTimelineYBoundsFromPaths(paths);
	const [xMin, xMax] = viewBounds;

	const x = (xMin + (xMax - xMin) * xt) * options.length;
	pos.x = x;

	const y = interpolate(yUp, yLow, yt);
	pos.y = y;

	return pos;
};

export const applyTimelineIndexAndValueShifts = (
	timeline: Timeline,
	selection: TimelineSelectionState,
): Timeline => {
	const { _indexShift, _valueShift } = timeline;

	if (typeof _indexShift !== "number" || typeof _valueShift !== "number") {
		return timeline;
	}

	const removeKeyframesAtIndex = new Set<number>();

	if (_indexShift !== 0) {
		for (let i = 0; i < timeline.keyframes.length; i += 1) {
			const keyframe = timeline.keyframes[i];
			if (selection.keyframes[keyframe.id]) {
				removeKeyframesAtIndex.add(keyframe.index + _indexShift);
			}
		}
	}

	const keyframes = [...timeline.keyframes]
		.filter((keyframe) => !removeKeyframesAtIndex.has(keyframe.index))
		.map<TimelineKeyframe>((keyframe) => {
			if (selection.keyframes[keyframe.id]) {
				return {
					...keyframe,
					index: keyframe.index + _indexShift,
					value: keyframe.value + _valueShift,
				};
			}

			return keyframe;
		})
		.sort((a, b) => a.index - b.index);

	return {
		...timeline,
		keyframes,
		_indexShift: null,
		_valueShift: null,
	};
};

/**
 * @returns ticks from lower to upper
 */
export const generateTimelineTicksFromBounds = ([a, b]: [number, number]) => {
	const diff = Math.abs(a - b);

	let fac = 0.0001;
	const multipliers = [0.1, 0.25, 0.5];
	let tickBy!: number;

	outer: while (fac < 100_000_000) {
		for (let i = 0; i < multipliers.length; i += 1) {
			if (diff < fac * multipliers[i] * 10) {
				tickBy = fac * multipliers[i];
				break outer;
			}
		}
		fac *= 10;
	}

	if (!tickBy) {
		return [];
	}

	const lower = Math.min(a, b);
	const upper = Math.max(a, b);

	const ticks: number[] = [Math.floor(lower / tickBy) * tickBy];
	do {
		ticks.push(ticks[ticks.length - 1] + tickBy);
	} while (ticks[ticks.length - 1] < upper);

	return ticks.map((tick) => Number(tick.toFixed(10)));
};

export function getTimelineSelection(timelineId: string): TimelineSelectionState {
	const selection = getActionState().timelineSelection;
	if (selection.timelineId !== timelineId) {
		return { timelineId, keyframes: {} };
	}
	return selection;
}

export function splitKeyframesAtIndex(
	k0: TimelineKeyframe,
	k1: TimelineKeyframe,
	index: number,
): [TimelineKeyframe, TimelineKeyframe, TimelineKeyframe] {
	let path: Line | CubicBezier;

	if (k0.controlPointRight && k1.controlPointLeft) {
		path = [
			Vec2.new(k0.index, k0.value),
			getControlPointAsVector("cp0", k0, k1)!,
			getControlPointAsVector("cp1", k0, k1)!,
			Vec2.new(k1.index, k1.value),
		];
	} else if (k0.controlPointRight || k1.controlPointLeft) {
		path = quadraticToCubicBezier([
			Vec2.new(k0.index, k0.value),
			getControlPointAsVector("cp0", k0, k1),
			getControlPointAsVector("cp1", k0, k1),
			Vec2.new(k1.index, k1.value),
		]);
	} else {
		path = [Vec2.new(k0.index, k0.value), Vec2.new(k1.index, k1.value)];
	}

	if (path.length === 2) {
		const t = (index - k0.index) / (k1.index - k0.index);
		const value = interpolate(k0.value, k1.value, t);
		const k: TimelineKeyframe = {
			controlPointLeft: null,
			controlPointRight: null,
			id: uuid(),
			index,
			reflectControlPoints: false,
			value,
		};
		return [k0, k, k1];
	}

	const yVals = path.map((p) => p.y);
	const maxY = Math.max(...yVals);
	const minY = Math.min(...yVals);

	const line: Line = [Vec2.new(index, maxY), Vec2.new(index, minY)];

	const results = intersectCubicBezierLine(path, line);

	if (results.length === 0) {
		console.warn("No results returned from 'intersectBezier3Line' when splitting keyframes.");
	}

	const t = results[0] ? results[0].t : 0.5;

	const [a, b] = splitCubicBezier(path, t);

	return [
		{
			...k0,
			controlPointRight: {
				relativeToDistance: index - k0.index,
				tx: 1 - (a[3].x - a[1].x) / (a[3].x - a[0].x),
				value: a[1].y - a[0].y,
			},
		},
		{
			id: uuid(),
			index,
			value: a[3].y,
			reflectControlPoints: true,
			controlPointLeft: {
				relativeToDistance: index - k0.index,
				tx: 1 - (a[3].x - a[2].x) / (a[3].x - a[0].x),
				value: a[2].y - a[3].y,
			},
			controlPointRight: {
				relativeToDistance: k1.index - index,
				tx: 1 - (b[3].x - b[1].x) / (b[3].x - b[0].x),
				value: b[1].y - b[0].y,
			},
		},
		{
			...k1,
			controlPointLeft: {
				relativeToDistance: k1.index - index,
				tx: 1 - (b[3].x - b[2].x) / (b[3].x - b[0].x),
				value: b[2].y - b[3].y,
			},
		},
	];
}
