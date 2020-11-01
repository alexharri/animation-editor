import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { Composition, Property } from "~/composition/compositionTypes";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import {
	TIMELINE_BETWEEN_LAYERS,
	TIMELINE_LAYER_HEIGHT,
	TIMELINE_TRACK_KEYFRAME_HEIGHT,
} from "~/constants";
import { cssVariables } from "~/cssVariables";
import { createGraphEditorNormalToViewportX } from "~/graphEditor/renderGraphEditor";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { renderRect } from "~/util/canvas/renderPrimitives";

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

	const compositionSelection = compSelectionFromState(composition.id, compositionSelectionState);

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
		yIndex * (TIMELINE_LAYER_HEIGHT + TIMELINE_BETWEEN_LAYERS) + 1 - panY;

	const renderEdge = (fillColor: string) => {
		const x0 = toTimelineX(0);
		const x1 = toTimelineX(composition.length);

		if (x0 > 0) {
			renderRect(
				ctx,
				{ left: 0, width: x0, top: getY(), height: TIMELINE_LAYER_HEIGHT },
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
					height: TIMELINE_LAYER_HEIGHT,
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
			{ left: 0, width: viewportWidth, top: getY(), height: TIMELINE_LAYER_HEIGHT },
			{ fillColor: cssVariables.gray500 },
		);
		renderEdge(selected ? cssVariables.dark700 : cssVariables.dark600);

		renderRect(
			ctx,
			{ left, width, top: getY(), height: TIMELINE_LAYER_HEIGHT },
			{ fillColor: selected ? cssVariables.light300 : cssVariables.gray700 },
		);

		// Render layer properties
		const renderProperty = (propertyId: string) => {
			const property = compositionState.properties[propertyId];

			if (property.type === "compound" && property.separated) {
				for (const propertyId of property.properties) {
					renderProperty(propertyId);
				}
				return;
			}

			yIndex++;

			const selected = compositionSelection.properties[propertyId];

			renderRect(
				ctx,
				{ left: 0, width: viewportWidth, top: getY(), height: TIMELINE_LAYER_HEIGHT },
				{ fillColor: cssVariables.dark800 },
			);
			renderEdge(selected ? cssVariables.dark700 : cssVariables.dark600);

			if (property.type === "group") {
				let { collapsed, properties } = property;

				if (property.viewProperties.length) {
					properties = property.viewProperties;
					collapsed = false;
				}

				if (!collapsed) {
					for (let j = 0; j < properties.length; j += 1) {
						renderProperty(properties[j]);
					}
				}
				return;
			}

			const renderTimeline = (timelineId: string) => {
				const timeline = timelines[timelineId];

				for (let j = 0; j < timeline.keyframes.length; j += 1) {
					const k = timeline.keyframes[j];

					const left = toTimelineX(layerIndex + k.index + keyframeIndexShift);
					const top = getY() + TIMELINE_LAYER_HEIGHT / 2;

					const selected = options.timelineSelection[timeline.id]?.keyframes[k.id];

					const W = TIMELINE_TRACK_KEYFRAME_HEIGHT / 2;

					ctx.beginPath();
					ctx.moveTo(left, top - W);

					const traceHalf = (hasControlPoint: boolean, fac: number) => {
						const W = (fac * TIMELINE_TRACK_KEYFRAME_HEIGHT) / 2;
						const O = fac * 1;
						const C = fac * 1.5;

						if (hasControlPoint) {
							ctx.lineTo(left + W, top - W);
							ctx.lineTo(left + W, top - W + C);
							ctx.lineTo(left + O, top - O);
							ctx.lineTo(left + O, top + O);
							ctx.lineTo(left + W, top + W - C);
							ctx.lineTo(left + W, top + W);
							ctx.lineTo(left, top + W);
						} else {
							ctx.lineTo(left + W, top);
							ctx.lineTo(left, top + W);
						}
					};

					traceHalf(!!k.controlPointRight, 1);
					traceHalf(!!k.controlPointLeft, -1);

					ctx.fillStyle = selected ? cssVariables.primary500 : cssVariables.light500;
					ctx.fill();
					ctx.closePath();
				}
			};

			if (property.type === "compound") {
				if (!property.animated) {
					return;
				}

				const { timelineId } = compositionState.properties[
					property.properties[0]
				] as Property;
				renderTimeline(timelineId);
				return;
			}

			if (!property.timelineId) {
				return;
			}

			renderTimeline(property.timelineId);
		};

		let { collapsed, properties } = layer;
		if (layer.viewProperties.length) {
			collapsed = false;
			properties = layer.viewProperties;
		}

		if (!collapsed) {
			for (let j = 0; j < properties.length; j += 1) {
				renderProperty(properties[j]);
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
