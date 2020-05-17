import {
	renderCircle,
	renderDiamond,
	renderCubicBezier,
	renderLine,
} from "~/util/canvas/renderPrimitives";
import { translateToRange, interpolate } from "~/util/math";
import {
	timelineKeyframesToPathList,
	getTimelineYBoundsFromPaths,
	generateTimelineTicksFromBounds,
} from "~/timeline/timelineUtils";
import { Timeline } from "~/timeline/timelineTypes";
import { cssVariables } from "~/cssVariables";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";

interface RenderTimelineOptions {
	ctx: Ctx;
	width: number;
	height: number;
	viewBounds: [number, number];
	length: number;
	timeline: Timeline;
	selection: TimelineSelectionState;
}

export const createToTimelineViewportX = (options: {
	length: number;
	viewBounds: [number, number];
	width: number;
}): ((value: number) => number) => {
	const { viewBounds, width } = options;

	const [tMin, tMax] = viewBounds;

	return (index: number) => {
		const length = options.length;
		return translateToRange((index / length) * width, tMin * width, tMax * width, width);
	};
};

export const createToTimelineViewportY = (options: {
	timeline: Timeline;
	height: number;
}): ((value: number) => number) => {
	const { timeline, height } = options;

	const keyframes = timeline.keyframes;

	const paths = timelineKeyframesToPathList(keyframes);
	const [yUpper, yLower] = timeline._yBounds || getTimelineYBoundsFromPaths(timeline, paths);
	const yUpLowDiff = yUpper - yLower;

	return (value: number) => {
		const yPan = timeline._yPan;
		const t = (value - yPan - yLower) / yUpLowDiff;
		return interpolate(height, 0, t);
	};
};

export const createToTimelineViewport = (options: RenderTimelineOptions): ((vec: Vec2) => Vec2) => {
	const toViewportX = createToTimelineViewportX(options);
	const toViewportY = createToTimelineViewportY(options);
	return (vec: Vec2) => Vec2.new(toViewportX(vec.x), toViewportY(vec.y));
};

export const renderTimeline = (options: RenderTimelineOptions) => {
	const { ctx, timeline, width, height, selection } = options;

	const toViewportY = createToTimelineViewportY(options);
	const toViewportX = createToTimelineViewportX(options);
	const toViewport = (vec: Vec2) => Vec2.new(toViewportX(vec.x), toViewportY(vec.y));

	const keyframes = timeline.keyframes;

	const paths = timelineKeyframesToPathList(keyframes);
	const [yUpper, yLower] = timeline._yBounds || getTimelineYBoundsFromPaths(timeline, paths);

	ctx.clearRect(0, 0, width, height);

	/**
	 * Ticks
	 */
	const ticks = generateTimelineTicksFromBounds([
		yUpper + timeline._yPan,
		yLower + timeline._yPan,
	]);

	for (let i = 0; i < ticks.length; i += 1) {
		const y = toViewportY(ticks[i]);
		const x1 = options.width;
		renderLine(ctx, Vec2.new(0, y), Vec2.new(x1, y), {
			color: cssVariables.dark600,
			strokeWidth: 1,
		});
		ctx.font = `10px ${cssVariables.fontFamily}`;
		ctx.fillStyle = cssVariables.light500;
		ctx.fillText(ticks[i].toString(), 8, y);
	}

	const transformedPaths = paths.map((path) => path.map((vec) => toViewport(vec))) as Array<
		CubicBezier | Line
	>;

	for (let i = 0; i < paths.length; i += 1) {
		const path = transformedPaths[i];
		if (path.length === 4) {
			renderCubicBezier(ctx, path, { color: "red", strokeWidth: 1 });
		} else {
			renderLine(ctx, path[0], path[1], { color: "red", strokeWidth: 1 });
		}
	}

	/**
	 * Control point lines
	 */
	for (let i = 0; i < keyframes.length - 1; i += 1) {
		const path = transformedPaths[i];

		if (path.length === 2) {
			continue;
		}

		const k0 = keyframes[i];
		const k1 = keyframes[i + 1];

		if (k0.controlPointRight) {
			renderLine(ctx, path[0], path[1], {
				color: "yellow",
				strokeWidth: 1,
			});
		}

		if (k1.controlPointLeft) {
			renderLine(ctx, path[2], path[3], {
				color: "yellow",
				strokeWidth: 1,
			});
		}
	}

	/**
	 * Keyframes
	 */
	keyframes.forEach((k) => {
		const vec = toViewport(Vec2.new(k.index, k.value));
		const selected = selection.timelineId === timeline.id && selection.keyframes[k.id];
		renderDiamond(ctx, vec, {
			fillColor: selected ? "#2f9eff" : "#333",
			width: 7.5,
			height: 7.5,
			strokeColor: "#2f9eff",
			strokeWidth: 1,
		});
	});

	/**
	 * Control point dots
	 */
	for (let i = 0; i < keyframes.length - 1; i += 1) {
		const path = transformedPaths[i];

		if (path.length === 2) {
			continue;
		}

		const k0 = keyframes[i];
		const k1 = keyframes[i + 1];

		if (k0.controlPointRight) {
			renderCircle(ctx, path[1], { color: "yellow", radius: 2 });
		}

		if (k1.controlPointLeft) {
			renderCircle(ctx, path[2], { color: "yellow", radius: 2 });
		}
	}
};
