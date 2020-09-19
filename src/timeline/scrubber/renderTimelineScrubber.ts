import { TIMELINE_SCRUBBER_HEIGHT } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { createGraphEditorNormalToViewportX } from "~/graphEditor/renderGraphEditor";
import { renderLine } from "~/util/canvas/renderPrimitives";

interface Options {
	width: number;
	viewBounds: [number, number];
	length: number;
}

export const renderTimelineScrubber = (ctx: Ctx, options: Options): void => {
	const { length, viewBounds, width } = options;

	const toTimelineX = createGraphEditorNormalToViewportX({
		compositionLength: length,
		viewBounds,
		width,
	});

	const h = TIMELINE_SCRUBBER_HEIGHT;

	const MIN_DIST = 46;

	let useSec = false;

	// For frames
	const potentialNBetween = [1, 2, 5, 10, 15, 30];
	let betweenIndex = 0;

	while (
		toTimelineX(potentialNBetween[betweenIndex]) - toTimelineX(0) < MIN_DIST &&
		betweenIndex < potentialNBetween.length
	) {
		betweenIndex++;
	}

	const nBetween = potentialNBetween[betweenIndex];

	let fac = 60;

	while (toTimelineX(fac) - toTimelineX(0) < MIN_DIST) {
		fac *= 2;
	}

	useSec = toTimelineX(fac) - toTimelineX(0) < MIN_DIST * 2;

	let tickBy!: number;

	tickBy = fac;

	ctx.clearRect(0, 0, width, h);

	const start = Math.floor(length * viewBounds[0]);
	const end = Math.ceil(length * viewBounds[1]);

	ctx.font = `10px ${cssVariables.fontFamily}`;
	ctx.fillStyle = cssVariables.light500;

	if (useSec) {
		for (let i = start - (start % tickBy); i <= end; i += tickBy) {
			const x = toTimelineX(i);

			const t = `${Number((i / 60).toFixed(2))}s`;
			const w = ctx.measureText(t).width;
			ctx.fillText(t, x - w / 2, 10);

			renderLine(ctx, Vec2.new(x, 14), Vec2.new(x, h), {
				color: cssVariables.light500,
				strokeWidth: 1,
			});
		}
		return;
	}

	const fStart = start - (start % nBetween);
	for (let i = fStart; i <= end; i += nBetween) {
		const x = toTimelineX(i);
		const d = i % 60;

		const t = d === 0 ? `${i / 60}:00f` : `${d}f`;
		const w = ctx.measureText(t).width;
		ctx.fillText(t, x - w / 2, 10);

		renderLine(ctx, Vec2.new(x, 14), Vec2.new(x, h), {
			color: cssVariables.light500,
			strokeWidth: 1,
		});
	}
};
