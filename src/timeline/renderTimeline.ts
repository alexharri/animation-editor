import {
	renderCircle,
	renderDiamond,
	renderCubicBezier,
	renderLine,
	renderRect,
} from "~/util/canvas/renderPrimitives";
import { translateToRange, interpolate, translateRectAsVec } from "~/util/math";
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
	timelines: Timeline[];
	colors: Partial<{ [timelineId: string]: string }>;
	selection: TimelineSelectionState;
	dragSelectRect: Rect | null;
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
	timelines: Timeline[];
	height: number;
}): ((value: number) => number) => {
	const { timelines, height } = options;

	const timelinePaths = timelines.map((timeline) =>
		timelineKeyframesToPathList(timeline.keyframes),
	);

	const [yUpper, yLower] =
		timelines[0]._yBounds || getTimelineYBoundsFromPaths(timelines, timelinePaths);
	const yUpLowDiff = yUpper - yLower;

	return (value: number) => {
		const yPan = timelines[0]._yPan;
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
	const { ctx, timelines, width, height, selection } = options;

	const toViewportY = createToTimelineViewportY(options);
	const toViewportX = createToTimelineViewportX(options);
	const toViewport = (vec: Vec2) => Vec2.new(toViewportX(vec.x), toViewportY(vec.y));

	ctx.clearRect(0, 0, width, height);

	const { _yBounds, _yPan } = timelines[0];

	const timelinePaths = timelines.map((timeline) =>
		timelineKeyframesToPathList(timeline.keyframes),
	);
	const [yUpper, yLower] = _yBounds || getTimelineYBoundsFromPaths(timelines, timelinePaths);

	/**
	 * Ticks
	 */
	const ticks = generateTimelineTicksFromBounds([yUpper + _yPan, yLower + _yPan]);

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

	timelines.forEach((timeline) => {
		const { keyframes } = timeline;
		const paths = timelineKeyframesToPathList(keyframes);

		const transformedPaths = paths.map((path) => path.map((vec) => toViewport(vec))) as Array<
			CubicBezier | Line
		>;

		for (let i = 0; i < paths.length; i += 1) {
			const color = options.colors[timeline.id] || "red";
			const path = transformedPaths[i];
			if (path.length === 4) {
				renderCubicBezier(ctx, path, { color, strokeWidth: 1 });
			} else {
				renderLine(ctx, path[0], path[1], { color, strokeWidth: 1 });
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
			const timelineSelection = selection[timeline.id];
			const selected = timelineSelection && timelineSelection.keyframes[k.id];
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

		if (options.dragSelectRect) {
			const rect = translateRectAsVec(options.dragSelectRect, toViewport);
			renderRect(ctx, rect, {
				strokeColor: "red",
				strokeWidth: 1,
				fillColor: "rgba(255, 0, 0, .1)",
			});
		}
	});
};
