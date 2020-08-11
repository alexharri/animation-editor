import { TIMELINE_CANVAS_END_START_BUFFER } from "~/constants";
import { Timeline } from "~/timeline/timelineTypes";
import { splitTimelinePathAtIndex, timelineKeyframesToPathList } from "~/timeline/timelineUtils";
import { interpolate } from "~/util/math";

export const getGraphEditorYBoundsFromPaths = (
	viewBounds: [number, number],
	length: number,
	timelines: Timeline[],
	_timelinePaths: Array<CubicBezier | Line>[],
): [number, number] => {
	const timelineYBounds = timelines.map((timeline, i): [number, number] => {
		if (timeline.keyframes.length === 1) {
			const { value } = timelines[0].keyframes[0];
			return [value, value];
		}

		let paths = _timelinePaths[i];
		const originalPaths = [...paths];

		const iStart = viewBounds[0] * (length - 1);
		const iEnd = viewBounds[1] * (length - 1);

		// Remove all paths before and after the viewbounds end
		paths = paths.filter((path) => {
			if (path[path.length - 1].x < iStart || path[0].x > iEnd) {
				return false;
			}
			return true;
		});

		const controlPointYsToConsider: number[] = [];

		// Split paths that intersect the viewbounds
		if (paths.length > 0) {
			const pathAtStart = paths[0];

			if (pathAtStart[0].x < iStart) {
				const [, newPathAtStart] = splitTimelinePathAtIndex(pathAtStart, iStart);
				paths[0] = newPathAtStart;

				if (pathAtStart.length === 4) {
					for (let j = 1; j < 3; j += 1) {
						if (pathAtStart[j].x > iStart) {
							controlPointYsToConsider.push(pathAtStart[j].y);
						}
					}
				}
			}

			const pathAtEnd = paths[paths.length - 1];

			if (pathAtEnd[pathAtEnd.length - 1].x > iEnd) {
				const [newPathAtEnd] = splitTimelinePathAtIndex(pathAtEnd, iEnd);
				paths[paths.length - 1] = newPathAtEnd;

				if (pathAtEnd.length === 4) {
					for (let j = 1; j < 3; j += 1) {
						if (pathAtEnd[j].x < iEnd) {
							controlPointYsToConsider.push(pathAtEnd[j].y);
						}
					}
				}
			}
		} else {
			const startIndex = originalPaths[0][0].x;
			const lastPath = originalPaths[originalPaths.length - 1];
			const y = startIndex > iStart ? originalPaths[0][0].y : lastPath[lastPath.length - 1].y;
			return [y, y];
		}

		if (paths.length) {
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

			for (let i = 0; i < controlPointYsToConsider.length; i += 1) {
				const value = controlPointYsToConsider[i];
				if (yUpper < value) {
					yUpper = value;
				}
				if (yLower > value) {
					yLower = value;
				}
			}

			return [yUpper, yLower];
		} else {
			const value =
				iEnd < timeline.keyframes[0].index
					? timeline.keyframes[0].value
					: timeline.keyframes[timeline.keyframes.length - 1].value;

			return [value, value];
		}
	});

	const yUpper = Math.max(...timelineYBounds.map(([value]) => value));
	const yLower = Math.min(...timelineYBounds.map(([, value]) => value));

	const diff = yUpper - yLower;

	if (diff === 0) {
		return [yUpper + 10, yUpper - 10];
	}

	// Add .1 of the diff on each side for padding.
	return [yUpper + diff * 0.1, yLower - diff * 0.1];
};

export const transformGlobalToGraphEditorPosition = (
	vec: Vec2,
	options: {
		length: number;
		timelines: Timeline[];
		viewBounds: [number, number];
		viewport: Rect;
	},
): Vec2 => {
	const { timelines, viewBounds, viewport } = options;

	const canvasWidth = viewport.width - TIMELINE_CANVAS_END_START_BUFFER * 2;
	const canvasLeft = viewport.left + TIMELINE_CANVAS_END_START_BUFFER;

	const pos = vec.subY(viewport.top).subX(canvasLeft);

	const xt = pos.x / canvasWidth;
	const yt = pos.y / viewport.height;

	const timelinePaths = timelines.map((timeline) =>
		timelineKeyframesToPathList(timeline.keyframes),
	);

	const [yUp, yLow] = getGraphEditorYBoundsFromPaths(
		viewBounds,
		options.length,
		timelines,
		timelinePaths,
	);
	const [xMin, xMax] = viewBounds;

	const x = (xMin + (xMax - xMin) * xt) * options.length;
	pos.x = x;

	const y = interpolate(yUp, yLow, yt);
	pos.y = y;

	return pos;
};

/**
 * @returns ticks from lower to upper
 */
export const generateGraphEditorTicksFromBounds = ([a, b]: [number, number]): number[] => {
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
