import { TIMELINE_CANVAS_END_START_BUFFER } from "~/constants";
import { cssVariables } from "~/cssVariables";
import {
	generateGraphEditorTicksFromBounds,
	getGraphEditorYBoundsFromPaths,
} from "~/graphEditor/graphEditorUtils";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { Timeline } from "~/timeline/timelineTypes";
import { timelineKeyframesToPathList } from "~/timeline/timelineUtils";
import {
	renderCircle,
	renderDiamond,
	renderLine,
	renderRect,
	traceCubicBezier,
	traceLine,
} from "~/util/canvas/renderPrimitives";
import { interpolate, translateRectAsVec, translateToRange } from "~/util/math";

interface RenderOptions {
	ctx: Ctx;
	width: number;
	height: number;
	viewBounds: [number, number];
	compositionLength: number;
	timelines: Timeline[];
	colors: Partial<{ [timelineId: string]: string }>;
	timelineSelectionState: TimelineSelectionState;
	dragSelectRect: Rect | null;
}

export const createGraphEditorNormalToViewportX = (options: {
	compositionLength: number;
	viewBounds: [number, number];
	width: number;
}): ((value: number) => number) => {
	const { viewBounds, width: realWidth } = options;

	const renderWidth = realWidth;
	const canvasWidth = realWidth - TIMELINE_CANVAS_END_START_BUFFER * 2;

	const [tMin, tMax] = viewBounds;

	return (index: number) => {
		const length = options.compositionLength;
		const t = index / length;
		return (
			translateToRange(t * renderWidth, tMin * renderWidth, tMax * renderWidth, canvasWidth) +
			TIMELINE_CANVAS_END_START_BUFFER
		);
	};
};

export const createGraphEditorNormalViewportY = (
	timelinePaths: (CubicBezier | Line)[][],
	options: {
		viewBounds: [number, number];
		compositionLength: number;
		timelines: Timeline[];
		height: number;
	},
): ((value: number) => number) => {
	const { timelines, height, viewBounds, compositionLength: length } = options;

	const [yUpper, yLower] =
		timelines[0]._yBounds ||
		getGraphEditorYBoundsFromPaths(viewBounds, length, timelines, timelinePaths);
	const yUpLowDiff = yUpper - yLower;

	return (value: number) => {
		const yPan = timelines[0]._yPan;
		const t = (value - yPan - yLower) / yUpLowDiff;
		return interpolate(height, 0, t);
	};
};

export const createGraphEditorNormalToViewport = (
	timelinePaths: (CubicBezier | Line)[][],
	options: {
		viewBounds: [number, number];
		compositionLength: number;
		timelines: Timeline[];
		width: number;
		height: number;
	},
) => {
	const toX = createGraphEditorNormalToViewportX(options);
	const toY = createGraphEditorNormalViewportY(timelinePaths, options);

	return (vec: Vec2) => Vec2.new(toX(vec.x), toY(vec.y));
};

export const renderGraphEditor = (options: RenderOptions): void => {
	const { ctx, timelines, width, height, timelineSelectionState, viewBounds } = options;

	ctx.clearRect(0, 0, width, height);

	if (timelines.length === 0) {
		return;
	}

	const timelinePaths = timelines.map((timeline) =>
		timelineKeyframesToPathList(timeline.keyframes),
	);

	const toViewportY = createGraphEditorNormalViewportY(timelinePaths, options);
	const toViewportX = createGraphEditorNormalToViewportX(options);
	const toViewport = (vec: Vec2) => Vec2.new(toViewportX(vec.x), toViewportY(vec.y));

	const atZero = toViewportX(0);
	const atEnd = toViewportX(options.compositionLength);

	if (atZero > 0) {
		renderRect(
			ctx,
			{
				left: atZero - TIMELINE_CANVAS_END_START_BUFFER - 1,
				width: TIMELINE_CANVAS_END_START_BUFFER,
				top: 0,
				height,
			},
			{ fillColor: cssVariables.dark500 },
		);
	}

	if (atEnd < width) {
		renderRect(
			ctx,
			{
				left: atEnd,
				width: width - atEnd + 1,
				top: 0,
				height,
			},
			{ fillColor: cssVariables.dark500 },
		);
	}

	const { _yBounds, _yPan } = timelines[0];

	const [yUpper, yLower] =
		_yBounds ||
		getGraphEditorYBoundsFromPaths(
			viewBounds,
			options.compositionLength,
			timelines,
			timelinePaths,
		);

	const ticks = generateGraphEditorTicksFromBounds([yUpper + _yPan, yLower + _yPan]);

	for (let i = 0; i < ticks.length; i += 1) {
		const y = toViewportY(ticks[i]);
		const x1 = options.width;
		renderLine(ctx, Vec2.new(0, y), Vec2.new(x1, y), {
			color: cssVariables.dark500,
			strokeWidth: 1,
		});
		ctx.font = `10px ${cssVariables.fontFamily}`;
		ctx.fillStyle = cssVariables.light500;
		ctx.fillText(ticks[i].toString(), 8, y - 2);
	}

	timelines.forEach((timeline) => {
		const { keyframes } = timeline;
		const paths = timelineKeyframesToPathList(keyframes);

		const transformedPaths = paths.map((path) => path.map((vec) => toViewport(vec))) as Array<
			CubicBezier | Line
		>;

		const color = options.colors[timeline.id] || "red";

		ctx.beginPath();
		for (let i = 0; i < paths.length; i += 1) {
			const path = transformedPaths[i];
			if (path.length === 4) {
				traceCubicBezier(ctx, path, { move: i === 0 });
			} else {
				traceLine(ctx, path, { move: i === 0 });
			}
		}
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.closePath();

		ctx.beginPath();
		{
			const { value: startValue, index: startIndex } = keyframes[0];
			const { value: endValue, index: endIndex } = keyframes[keyframes.length - 1];

			const startX = toViewportX(startIndex);
			const startY = toViewportY(startValue);

			const endX = toViewportX(endIndex);
			const endY = toViewportY(endValue);

			if (startX > 0) {
				traceLine(ctx, [Vec2.new(startX, startY), Vec2.new(0, startY)], { move: true });
			}

			if (endX < width) {
				traceLine(ctx, [Vec2.new(endX, endY), Vec2.new(width, endY)], { move: true });
			}
		}
		ctx.setLineDash([8, 8]);
		ctx.stroke();
		ctx.closePath();
		ctx.setLineDash([]);

		/**
		 * Control point lines
		 */
		ctx.beginPath();
		for (let i = 0; i < keyframes.length - 1; i += 1) {
			const path = transformedPaths[i];

			if (path.length === 2) {
				continue;
			}

			const k0 = keyframes[i];
			const k1 = keyframes[i + 1];

			if (k0.controlPointRight) {
				traceLine(ctx, [path[0], path[1]], { move: true });
			}

			if (k1.controlPointLeft) {
				traceLine(ctx, [path[2], path[3]], { move: true });
			}
		}
		ctx.setLineDash([]);
		ctx.strokeStyle = "yellow";
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.closePath();

		/**
		 * Keyframes
		 */
		keyframes.forEach((k) => {
			const vec = toViewport(Vec2.new(k.index, k.value));
			const timelineSelection = timelineSelectionState[timeline.id];
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
				strokeColor: cssVariables.red500,
				strokeWidth: 1,
				fillColor: "rgba(255, 0, 0, .1)",
			});
		}
	});
};
