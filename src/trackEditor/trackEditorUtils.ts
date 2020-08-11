import { CompositionState } from "~/composition/compositionReducer";
import { COMP_TIME_BETWEEN_LAYERS, COMP_TIME_LAYER_HEIGHT } from "~/constants";

type TrackYPositions = {
	timeline: { [timelineId: string]: number };
	property: { [propertyId: string]: number };
	layer: { [layerId: string]: number };
};

export const getTimelineTrackYPositions = (
	compositionId: string,
	compositionState: CompositionState,
	panY: number,
): TrackYPositions => {
	const map: TrackYPositions = { layer: {}, property: {}, timeline: {} };

	const composition = compositionState.compositions[compositionId];

	let yIndex = 0;

	const getY = (): number =>
		yIndex * (COMP_TIME_LAYER_HEIGHT + COMP_TIME_BETWEEN_LAYERS) + 1 - panY;

	for (let i = 0; i < composition.layers.length; i += 1) {
		const layerId = composition.layers[i];
		const layer = compositionState.layers[layerId];

		map.layer[layer.id] = getY();

		const crawlProperty = (propertyId: string) => {
			yIndex++;

			const property = compositionState.properties[propertyId];

			map.property[property.id] = getY();

			if (property.type === "group") {
				if (!property.collapsed) {
					for (let j = 0; j < property.properties.length; j += 1) {
						crawlProperty(property.properties[j]);
					}
				}
				return;
			}

			if (property.timelineId) {
				map.timeline[property.timelineId] = getY();
			}
		};

		if (!layer.collapsed) {
			for (let j = 0; j < layer.properties.length; j += 1) {
				crawlProperty(layer.properties[j]);
			}
		}

		yIndex++;
	}

	return map;
};

export const getTimelineLayerListHeight = (
	compositionId: string,
	compositionState: CompositionState,
): number => {
	const composition = compositionState.compositions[compositionId];

	let yIndex = 0;

	for (let i = 0; i < composition.layers.length; i += 1) {
		const layerId = composition.layers[i];
		const layer = compositionState.layers[layerId];

		// Render layer properties
		const renderProperty = (propertyId: string) => {
			yIndex++;

			const property = compositionState.properties[propertyId];

			if (property.type === "group" && !property.collapsed) {
				for (let j = 0; j < property.properties.length; j += 1) {
					renderProperty(property.properties[j]);
				}
			}
		};

		if (!layer.collapsed) {
			for (let j = 0; j < layer.properties.length; j += 1) {
				renderProperty(layer.properties[j]);
			}
		}

		yIndex++;
	}

	return (yIndex + 1) * (COMP_TIME_LAYER_HEIGHT + COMP_TIME_BETWEEN_LAYERS) + 2;
};

export const capTimelinePanY = (
	yPan: number,
	compositionId: string,
	viewportHeight: number,
	compositionState: CompositionState,
) => {
	let y = yPan;

	const height = getTimelineLayerListHeight(compositionId, compositionState);

	y = Math.max(0, Math.min(y, height - viewportHeight));

	return y;
};
