import Bezier from "bezier-easing";
import uuid from "uuid/v4";
import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { reduceCompProperties } from "~/composition/compositionUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import {
	TIMELINE_CANVAS_END_START_BUFFER,
	TIMELINE_CP_TX_MAX,
	TIMELINE_CP_TX_MIN,
} from "~/constants";
import { getActionState } from "~/state/stateUtils";
import { TimelineSelection, TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { Timeline, TimelineKeyframe, TimelineKeyframeControlPoint } from "~/timeline/timelineTypes";
import {
	capToRange,
	getDistance,
	interpolate,
	interpolateCubicBezier,
	translateToRange,
} from "~/util/math";
import { intersectCubicBezierLine } from "~/util/math/intersection/intersectBezier3Line";
import { splitCubicBezier } from "~/util/math/splitCubicBezier";

const isFlatBezier = (bezier: CubicBezier) => {
	const y = bezier[0].y;
	for (let i = 1; i < bezier.length; i++) {
		if (y !== bezier[i].y) {
			return false;
		}
	}
	return true;
};

const calcP2 = (p3: Vec2, p1: Vec2): Vec2 => {
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

interface GetTimelineValueAtIndexOptions {
	timeline: Timeline;
	frameIndex: number;
	layerIndex: number;
	selection?: TimelineSelection;
}

export function getTimelineValueAtIndex(options: GetTimelineValueAtIndexOptions): number {
	const index = options.frameIndex - options.layerIndex;
	let timeline = options.timeline;

	if (typeof timeline._indexShift) {
		timeline = applyTimelineIndexAndValueShifts(timeline, options.selection);
	}

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

		if (yDiff === 0) {
			// The keyframes have the same value, we can't use Bezier to
			// get the Y value.
			//
			// Find intersection with vertical line at index.
			let yMax = -Infinity;
			let yMin = Infinity;

			for (const p of path) {
				if (yMax < p.y) {
					yMax = p.y;
				}
				if (yMin > p.y) {
					yMin = p.y;
				}
			}

			if (yMax === yMin) {
				// Bezier is flat, Y value of all control points is the same.
				return yMax;
			}

			const intersectionLine: Line = [Vec2.new(index, yMin - 1), Vec2.new(index, yMax + 1)];
			const results = intersectCubicBezierLine(path, intersectionLine);

			if (results.length === 0) {
				console.log({ path });
				throw new Error("No intersection found for cubic bezier between two keyframes.");
			}

			const { t } = results[0];
			return interpolateCubicBezier(path, t).y;
		}

		const x1 = (path[1].x - path[0].x) / xDiff;
		const y1 = (path[1].y - path[0].y) / yDiff;
		const x2 = (path[2].x - path[0].x) / xDiff;
		const y2 = (path[2].y - path[0].y) / yDiff;

		return interpolate(path[0].y, path[3].y, Bezier(x1, y1, x2, y2)(linearT));
	}

	return 0 as never;
}

export const timelineNormalToGlobalX = (
	timelineX: number,
	viewBounds: [number, number],
	viewport: Rect,
	compositionLength: number,
): number => {
	const renderWidth = viewport.width;
	const canvasWidth = viewport.width - TIMELINE_CANVAS_END_START_BUFFER * 2;

	const [tMin, tMax] = viewBounds;

	const t = timelineX / compositionLength;
	return (
		translateToRange(t * renderWidth, tMin * renderWidth, tMax * renderWidth, canvasWidth) +
		TIMELINE_CANVAS_END_START_BUFFER +
		viewport.left
	);
};

export const graphEditorGlobalToNormal = (
	value: number,
	options: {
		viewBounds: [number, number];
		viewport: Rect;
		compositionLength: number;
	},
): number => {
	const canvasWidth = options.viewport.width - TIMELINE_CANVAS_END_START_BUFFER * 2;
	const canvasLeft = options.viewport.left + TIMELINE_CANVAS_END_START_BUFFER;

	const xt = (value - canvasLeft) / canvasWidth;

	const [xMin, xMax] = options.viewBounds;
	const x = (xMin + (xMax - xMin) * xt) * options.compositionLength;

	return x;
};

export const trackEditorGlobalToNormal = (
	vec: Vec2,
	options: {
		compositionLength: number;
		viewBounds: [number, number];
		viewport: Rect;
	},
): Vec2 => {
	const { viewBounds, viewport } = options;

	const canvasWidth = viewport.width - TIMELINE_CANVAS_END_START_BUFFER * 2;
	const canvasLeft = viewport.left + TIMELINE_CANVAS_END_START_BUFFER;

	const pos = vec.subY(viewport.top).subX(canvasLeft);
	const xt = pos.x / canvasWidth;
	const [xMin, xMax] = viewBounds;
	pos.x = (xMin + (xMax - xMin) * xt) * options.compositionLength;

	return pos;
};

const _applyNewControlPointShift = (_timeline: Timeline): Timeline => {
	const timeline = _timeline;

	const _newControlPointShift = timeline._newControlPointShift!;

	const { indexShift, valueShift, keyframeIndex: index, direction } = _newControlPointShift;

	const keyframes = timeline.keyframes.map<TimelineKeyframe>((k, i) => {
		if (i !== index) {
			return k;
		}

		const k0 = timeline.keyframes[i - 1];
		const k1 = timeline.keyframes[i];
		const k2 = timeline.keyframes[i + 1];

		const fac = direction === "left" ? 1 : -1;
		const cap = (t: number) => capToRange(0, 1, t);

		const controlPointLeft = k0
			? {
					value: valueShift * fac,
					tx: cap((k1.index + indexShift * fac - k0.index) / (k1.index - k0.index)),
					relativeToDistance: k1.index - k0.index,
			  }
			: null;

		const controlPointRight = k2
			? {
					value: -(valueShift * fac),
					tx: cap(1 - (k2.index + indexShift * fac - k1.index) / (k2.index - k1.index)),
					relativeToDistance: k2.index - k1.index,
			  }
			: null;

		return { ...k, controlPointLeft, controlPointRight };
	});

	return {
		...timeline,
		_newControlPointShift: null,
		keyframes,
	};
};

const _applyControlPointShift = (_timeline: Timeline, selection: TimelineSelection): Timeline => {
	const timeline = _timeline;

	const _controlPointShift = timeline._controlPointShift!;

	const {
		indexShift: parentIndexShift,
		valueShift,
		indexDiff: parentIndexDiff,
		direction: direction,
		yFac,
		shiftDown,
	} = _controlPointShift;

	const keyframes = timeline.keyframes.map<TimelineKeyframe>((k, i) => {
		if (!selection.keyframes[k.id]) {
			return k;
		}

		const computeCp = (
			i0: number,
			i1: number,
			cp: TimelineKeyframeControlPoint,
		): TimelineKeyframeControlPoint => {
			const indexDiff = timeline.keyframes[i0].index - timeline.keyframes[i1].index;
			const indexShift = parentIndexShift * (parentIndexDiff / indexDiff);
			return {
				relativeToDistance: indexDiff,
				tx: capToRange(
					TIMELINE_CP_TX_MIN,
					TIMELINE_CP_TX_MAX,
					cp.tx + indexShift / parentIndexDiff,
				),
				value: shiftDown ? 0 : cp.value * (indexDiff / cp.relativeToDistance) + valueShift,
			};
		};

		if (direction === "left") {
			if (!timeline.keyframes[i - 1] || !k.controlPointLeft) {
				return k;
			}

			const reflect =
				k.reflectControlPoints && k.controlPointRight && timeline.keyframes[i + 1];

			const cpl = computeCp(i, i - 1, k.controlPointLeft);
			let cpr: TimelineKeyframeControlPoint | null;

			const oldCpr = k.controlPointRight!;

			if (reflect) {
				const k0 = timeline.keyframes[i - 1];
				const k1 = timeline.keyframes[i];
				const k2 = timeline.keyframes[i + 1];

				const cplPos = Vec2.new(
					interpolate(k0.index, k1.index, cpl.tx),
					k.value + cpl.value,
				);
				const cprPos = Vec2.new(
					interpolate(k1.index, k2.index, oldCpr.tx),
					k.value + oldCpr.value,
				);

				const kPos = Vec2.new(k1.index, k1.value);
				const lDist = getDistance(kPos.scaleX(yFac), cplPos.scaleX(yFac));
				const rDist = getDistance(kPos.scaleX(yFac), cprPos.scaleX(yFac));

				const cprPosNew = cplPos.scale(-1, kPos).scale(rDist / lDist, kPos);

				cpr = {
					relativeToDistance: k2.index - k1.index,
					tx: capToRange(
						TIMELINE_CP_TX_MIN,
						TIMELINE_CP_TX_MAX,
						(cprPosNew.x - k1.index) / (k2.index - k1.index),
					),
					value: cprPosNew.y - k1.value,
				};
			} else {
				cpr = k.controlPointRight;
			}

			return {
				...k,
				controlPointLeft: cpl,
				controlPointRight: cpr,
			};
		} else {
			if (!timeline.keyframes[i + 1] || !k.controlPointRight) {
				return k;
			}

			const reflect =
				k.reflectControlPoints && k.controlPointLeft && timeline.keyframes[i - 1];

			const cpr = computeCp(i + 1, i, k.controlPointRight);
			let cpl: TimelineKeyframeControlPoint | null;

			const oldCpl = k.controlPointLeft!;

			if (reflect) {
				const k0 = timeline.keyframes[i - 1];
				const k1 = timeline.keyframes[i];
				const k2 = timeline.keyframes[i + 1];

				const cplPos = Vec2.new(
					interpolate(k0.index, k1.index, oldCpl.tx),
					k.value + oldCpl.value,
				);
				const cprPos = Vec2.new(
					interpolate(k1.index, k2.index, cpr.tx),
					k.value + cpr.value,
				);

				const kPos = Vec2.new(k1.index, k1.value);
				const lDist = getDistance(kPos.scaleX(yFac), cplPos.scaleX(yFac));
				const rDist = getDistance(kPos.scaleX(yFac), cprPos.scaleX(yFac));

				const cplPosNew = cprPos.scale(-1, kPos).scale(lDist / rDist, kPos);

				cpl = {
					relativeToDistance: k1.index - k0.index,
					tx: capToRange(
						TIMELINE_CP_TX_MIN,
						TIMELINE_CP_TX_MAX,
						(cplPosNew.x - k0.index) / (k1.index - k0.index),
					),
					value: cplPosNew.y - k1.value,
				};
			} else {
				cpl = k.controlPointLeft;
			}

			return {
				...k,
				controlPointRight: cpr,
				controlPointLeft: cpl,
			};
		}
	});

	return {
		...timeline,
		_controlPointShift: null,
		keyframes,
	};
};

export const applyTimelineIndexAndValueShifts = (
	_timeline: Timeline,
	selection: TimelineSelection | undefined,
): Timeline => {
	const timeline = _timeline;

	if (!selection) {
		if (
			timeline._indexShift ||
			timeline._valueShift ||
			timeline._controlPointShift ||
			timeline._newControlPointShift
		) {
			return {
				...timeline,
				_indexShift: null,
				_valueShift: null,
				_controlPointShift: null,
				_newControlPointShift: null,
			};
		}

		return timeline;
	}

	const { _indexShift, _valueShift, _controlPointShift, _newControlPointShift } = timeline;

	if (_controlPointShift) {
		return _applyControlPointShift(_timeline, selection);
	}

	if (_newControlPointShift) {
		return _applyNewControlPointShift(_timeline);
	}

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
		.filter((keyframe) => {
			if (selection.keyframes[keyframe.id]) {
				return true;
			}

			return !removeKeyframesAtIndex.has(keyframe.index);
		})
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

const _emptyTimelineSelection: TimelineSelection = { keyframes: {} };
export function getTimelineSelection(timelineId: string): TimelineSelection {
	const selection = getActionState().timelineSelectionState;
	return selection[timelineId] || _emptyTimelineSelection;
}

export const timelineSelectionFromState = (
	timelineId: string,
	timelineSelectionState: TimelineSelectionState,
): TimelineSelection => {
	return timelineSelectionState[timelineId] || _emptyTimelineSelection;
};

export const splitTimelinePathAtIndex = <T extends Line | CubicBezier>(
	path: T,
	index: number,
): [T, T] => {
	if (path.length === 2) {
		const t = (index - path[0].x) / (path[1].x - path[0].x);
		const mid = path[0].lerp(path[1], t);
		return [[path[0], mid] as T, [mid, path[1]] as T];
	}

	const bezier = path as CubicBezier;
	const yVals = path.map((p) => p.y);
	const maxY = Math.max(...yVals);
	const minY = Math.min(...yVals);

	const intersectionLine: Line = [Vec2.new(index, maxY), Vec2.new(index, minY)];

	if (isFlatBezier(bezier)) {
		return splitCubicBezier(bezier, 0.5) as [T, T];
	}

	/**
	 * @todo handle flat bezier case
	 */
	const results = intersectCubicBezierLine(bezier, intersectionLine);

	if (results.length === 0) {
		console.warn("No results returned from 'intersectBezier3Line' when splitting keyframes.");
	}

	const splitT = results[0]?.t ?? 0.5;

	const [a, b] = splitCubicBezier(bezier, splitT);

	return [a as T, b as T];
};

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

	/**
	 * @todo handle flat bezier case
	 */
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
				tx: capToRange(0, 1, 1 - (a[3].x - a[1].x) / (a[3].x - a[0].x)),
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
				tx: capToRange(0, 1, 1 - (a[3].x - a[2].x) / (a[3].x - a[0].x)),
				value: a[2].y - a[3].y,
			},
			controlPointRight: {
				relativeToDistance: k1.index - index,
				tx: capToRange(0, 1, 1 - (b[3].x - b[1].x) / (b[3].x - b[0].x)),
				value: b[1].y - b[0].y,
			},
		},
		{
			...k1,
			controlPointLeft: {
				relativeToDistance: k1.index - index,
				tx: capToRange(0, 1, 1 - (b[3].x - b[2].x) / (b[3].x - b[0].x)),
				value: b[2].y - b[3].y,
			},
		},
	];
}

export const createTimelineKeyframe = (value: number, index: number): TimelineKeyframe => {
	return {
		controlPointLeft: null,
		controlPointRight: null,
		id: uuid(),
		index,
		value,
		reflectControlPoints: false,
	};
};

export const createTimelineForLayerProperty = (value: number, index: number): Timeline => {
	return {
		id: uuid(),
		keyframes: [
			{
				controlPointLeft: null,
				controlPointRight: null,
				id: uuid(),
				index,
				value,
				reflectControlPoints: false,
			},
		],
		_yBounds: null,
		_yPan: 0,
		_indexShift: null,
		_valueShift: null,
		_controlPointShift: null,
		_newControlPointShift: null,
		_dragSelectRect: null,
	};
};

export const getSelectedTimelineIdsInComposition = (
	compositionId: string,
	compositionState: CompositionState,
	compositionSelectionState: CompositionSelectionState,
) => {
	const compositionSelection = getCompSelectionFromState(
		compositionId,
		compositionSelectionState,
	);
	return reduceCompProperties<string[]>(
		compositionId,
		compositionState,
		(acc, property) => {
			if (property.timelineId && compositionSelection.properties[property.id]) {
				acc.push(property.timelineId);
			}
			return acc;
		},
		[],
	);
};
