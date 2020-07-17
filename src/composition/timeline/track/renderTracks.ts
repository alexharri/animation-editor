import { Composition } from "~/composition/compositionTypes";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { createToTimelineViewportX } from "~/timeline/renderTimeline";
import { CompositionState } from "~/composition/state/compositionReducer";
import { renderRect, renderDiamond } from "~/util/canvas/renderPrimitives";
import { cssVariables } from "~/cssVariables";
import { TimelineState } from "~/timeline/timelineReducer";
import { TRACK_KEYFRAME_HEIGHT } from "~/constants";

interface RenderTimelineOptions {
	ctx: Ctx;
	viewportWidth: number;
	viewportHeight: number;
	pan: Vec2;
	viewBounds: [number, number];
	composition: Composition;
	compositionSelection: CompositionSelectionState;
	compositionState: CompositionState;
	timelines: TimelineState;
	timelineSelection: TimelineSelectionState;
	dragSelectRect: Rect | null;
}

export const renderTracks = (options: RenderTimelineOptions) => {
	const {
		ctx,
		compositionState,
		composition,
		viewBounds,
		viewportWidth,
		viewportHeight,
		timelines,
	} = options;

	ctx.clearRect(0, 0, viewportWidth, viewportHeight);
	renderRect(
		ctx,
		{ left: 0, top: 0, width: viewportWidth, height: viewportHeight },
		{ fillColor: cssVariables.dark300 },
	);

	const toTimelineX = createToTimelineViewportX({
		length: composition.length,
		viewBounds,
		width: viewportWidth,
	});

	const HEIGHT = 16;
	const BETWEEN_LAYERS = 1;
	let yIndex = 0;

	const getY = (): number => yIndex * (HEIGHT + BETWEEN_LAYERS) + 1;

	for (let i = 0; i < composition.layers.length; i += 1) {
		const layerId = composition.layers[i];
		const layer = compositionState.layers[layerId];

		// Render layer bar
		const x0 = toTimelineX(layer.index);
		const x1 = toTimelineX(layer.index + layer.length);

		const left = x0;
		const width = x1 - x0;

		renderRect(
			ctx,
			{ left, width, top: getY(), height: HEIGHT },
			{ fillColor: cssVariables.gray600 },
		);

		// Render layer properties
		const renderProperty = (propertyId: string) => {
			yIndex++;

			const property = compositionState.properties[propertyId];

			renderRect(
				ctx,
				{ left: 0, width: viewportWidth, top: getY(), height: HEIGHT },
				{ fillColor: cssVariables.dark600 },
			);

			if (property.type === "group") {
				for (let j = 0; j < property.properties.length; j += 1) {
					renderProperty(property.properties[j]);
				}
				return;
			}

			if (!property.timelineId) {
				return;
			}

			const timeline = timelines[property.timelineId];

			for (let j = 0; j < timeline.keyframes.length; j += 1) {
				const k = timeline.keyframes[j];

				const left = toTimelineX(layer.index + k.index);
				const top = getY() + HEIGHT / 2;

				renderDiamond(ctx, Vec2.new(left, top), {
					width: TRACK_KEYFRAME_HEIGHT,
					height: TRACK_KEYFRAME_HEIGHT,
					fillColor: cssVariables.light500,
				});
			}
		};

		for (let j = 0; j < layer.properties.length; j += 1) {
			renderProperty(layer.properties[j]);
		}

		yIndex++;
	}
};
