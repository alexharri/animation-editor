import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { Composition } from "~/composition/compositionTypes";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import {
	COMP_TIME_BETWEEN_LAYERS,
	COMP_TIME_LAYER_HEIGHT,
	COMP_TIME_TRACK_KEYFRAME_HEIGHT,
} from "~/constants";
import { cssVariables } from "~/cssVariables";
import { createGraphEditorNormalToViewportX } from "~/graphEditor/renderGraphEditor";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { renderDiamond, renderRect } from "~/util/canvas/renderPrimitives";

interface RenderTimelineOptions {
	ctx: Ctx;
	viewportWidth: number;
	viewportHeight: number;
	panY: number;
	viewBounds: [number, number];
	composition: Composition;
	compositionSelectionState: CompositionSelectionState;
	compositionState: CompositionState;
	timelines: TimelineState;
	timelineSelection: TimelineSelectionState;
	trackDragSelectRect: Rect | null;
	layerIndexShift: number;
	layerLengthShift: [number, number];
}

export const renderTracks = (options: RenderTimelineOptions) => {
	const {
		ctx,
		compositionState,
		composition,
		compositionSelectionState,
		viewBounds,
		viewportWidth,
		viewportHeight,
		timelines,
		panY,
		layerIndexShift,
		layerLengthShift,
	} = options;

	const compositionSelection = getCompSelectionFromState(
		composition.id,
		compositionSelectionState,
	);

	const getLayerIndexAndLength = (layerId: string): [number, number] => {
		const layer = compositionState.layers[layerId];

		if (!compositionSelection.layers[layer.id]) {
			return [layer.index, layer.length];
		}

		const compositionLength = compositionState.compositions[layer.compositionId].length;

		const length = Math.min(
			compositionLength - layer.index,
			Math.max(0, layer.length - layerLengthShift[0] + layerLengthShift[1]),
		);
		const index = Math.max(0, layer.index + layerIndexShift + layerLengthShift[0]);

		return [index, length];
	};

	ctx.clearRect(0, 0, viewportWidth, viewportHeight);
	renderRect(
		ctx,
		{ left: 0, top: 0, width: viewportWidth, height: viewportHeight },
		{ fillColor: cssVariables.dark500 },
	);

	const toTimelineX = createGraphEditorNormalToViewportX({
		compositionLength: composition.length,
		viewBounds,
		width: viewportWidth,
	});

	let yIndex = 0;

	const getY = (): number =>
		yIndex * (COMP_TIME_LAYER_HEIGHT + COMP_TIME_BETWEEN_LAYERS) + 1 - panY;

	const renderEdge = (fillColor: string) => {
		const x0 = toTimelineX(0);
		const x1 = toTimelineX(composition.length);

		if (x0 > 0) {
			renderRect(
				ctx,
				{ left: 0, width: x0, top: getY(), height: COMP_TIME_LAYER_HEIGHT },
				{ fillColor },
			);
		}
		if (x1 < viewportWidth) {
			renderRect(
				ctx,
				{
					left: x1,
					width: viewportWidth - x1,
					top: getY(),
					height: COMP_TIME_LAYER_HEIGHT,
				},
				{ fillColor },
			);
		}
	};

	for (let i = 0; i < composition.layers.length; i += 1) {
		const layerId = composition.layers[i];
		const layer = compositionState.layers[layerId];
		const selected = compositionSelection.layers[layerId];

		const [layerIndex, layerLength] = getLayerIndexAndLength(layerId);
		const keyframeIndexShift = selected ? -layerLengthShift[0] : 0;

		// Render layer bar
		const x0 = toTimelineX(layerIndex);
		const x1 = toTimelineX(layerIndex + layerLength);

		const left = x0;
		const width = x1 - x0;

		renderRect(
			ctx,
			{ left: 0, width: viewportWidth, top: getY(), height: COMP_TIME_LAYER_HEIGHT },
			{ fillColor: cssVariables.gray500 },
		);
		renderEdge(selected ? cssVariables.dark700 : cssVariables.dark600);

		renderRect(
			ctx,
			{ left, width, top: getY(), height: COMP_TIME_LAYER_HEIGHT },
			{ fillColor: selected ? cssVariables.light300 : cssVariables.gray700 },
		);

		// Render layer properties
		const renderProperty = (propertyId: string) => {
			yIndex++;

			const property = compositionState.properties[propertyId];
			const selected = compositionSelection.properties[propertyId];

			renderRect(
				ctx,
				{ left: 0, width: viewportWidth, top: getY(), height: COMP_TIME_LAYER_HEIGHT },
				{ fillColor: cssVariables.dark800 },
			);
			renderEdge(selected ? cssVariables.dark700 : cssVariables.dark600);

			if (property.type === "group") {
				if (!property.collapsed) {
					for (let j = 0; j < property.properties.length; j += 1) {
						renderProperty(property.properties[j]);
					}
				}
				return;
			}

			if (!property.timelineId) {
				return;
			}

			const timeline = timelines[property.timelineId];

			for (let j = 0; j < timeline.keyframes.length; j += 1) {
				const k = timeline.keyframes[j];

				const left = toTimelineX(layerIndex + k.index + keyframeIndexShift);
				const top = getY() + COMP_TIME_LAYER_HEIGHT / 2;

				const selected = options.timelineSelection[timeline.id]?.keyframes[k.id];

				renderDiamond(ctx, Vec2.new(left, top), {
					width: COMP_TIME_TRACK_KEYFRAME_HEIGHT,
					height: COMP_TIME_TRACK_KEYFRAME_HEIGHT,
					fillColor: selected ? cssVariables.primary500 : cssVariables.light500,
				});
			}
		};

		if (!layer.collapsed) {
			for (let j = 0; j < layer.properties.length; j += 1) {
				renderProperty(layer.properties[j]);
			}
		}

		yIndex++;
	}

	if (options.trackDragSelectRect) {
		const x0 = toTimelineX(options.trackDragSelectRect.left);
		const x1 = toTimelineX(
			options.trackDragSelectRect.left + options.trackDragSelectRect.width,
		);

		const left = x0;
		const width = x1 - x0;

		const top = options.trackDragSelectRect.top;
		const height = options.trackDragSelectRect.height;

		renderRect(
			ctx,
			{ top, left, width, height },
			{
				strokeColor: "red",
				strokeWidth: 1,
				fillColor: "rgba(255, 0, 0, .1)",
			},
		);
	}
};
