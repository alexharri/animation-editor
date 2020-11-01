import { CompositionState } from "~/composition/compositionReducer";
import { Property } from "~/composition/compositionTypes";
import { TIMELINE_BETWEEN_LAYERS, TIMELINE_ITEM_HEIGHT, TIMELINE_LAYER_HEIGHT } from "~/constants";

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
		yIndex * (TIMELINE_LAYER_HEIGHT + TIMELINE_BETWEEN_LAYERS) + 1 - panY;

	for (let i = 0; i < composition.layers.length; i += 1) {
		const layerId = composition.layers[i];
		const layer = compositionState.layers[layerId];

		map.layer[layer.id] = getY();

		const crawlProperty = (propertyId: string) => {
			const property = compositionState.properties[propertyId];

			// Separated compound properties are not rendered
			if (property.type === "compound" && property.separated) {
				for (const propertyId of property.properties) {
					crawlProperty(propertyId);
				}
				return;
			}

			yIndex++;

			map.property[property.id] = getY();

			if (property.type === "group") {
				let { collapsed, properties } = property;

				if (property.viewProperties.length) {
					properties = property.viewProperties;
					collapsed = false;
				}

				if (!collapsed) {
					for (let j = 0; j < properties.length; j += 1) {
						crawlProperty(properties[j]);
					}
				}
				return;
			}

			if (property.type === "compound") {
				if (!property.animated) {
					return;
				}

				// If a compound property is animated, every single sub-property has
				// a timeline.
				//
				// In the track editor, they are displayed as a single timeline.
				for (const propertyId of property.properties) {
					const p = compositionState.properties[propertyId] as Property;
					map.timeline[p.timelineId] = getY();
				}
				return;
			}

			if (property.timelineId) {
				map.timeline[property.timelineId] = getY();
			}
		};

		let { collapsed, properties } = layer;

		if (layer.viewProperties.length) {
			collapsed = false;
			properties = layer.viewProperties;
		}

		if (!collapsed) {
			for (let j = 0; j < properties.length; j += 1) {
				crawlProperty(properties[j]);
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
	let n = 0;

	const composition = compositionState.compositions[compositionId];

	for (const layerId of composition.layers) {
		n++; // Layer is one item

		const crawl = (propertyId: string) => {
			n++; // Each property is one item, collapsed or not

			const property = compositionState.properties[propertyId];

			if (property.type === "group") {
				let { collapsed, properties } = property;

				if (property.viewProperties.length) {
					properties = property.viewProperties;
					collapsed = false;
				}

				if (!collapsed) {
					for (const propertyId of properties) {
						crawl(propertyId);
					}
				}
			}
		};

		const layer = compositionState.layers[layerId];

		let { collapsed, properties } = layer;

		if (layer.viewProperties.length) {
			collapsed = false;
			properties = layer.viewProperties;
		}

		if (!collapsed) {
			for (let j = 0; j < properties.length; j += 1) {
				crawl(properties[j]);
			}
		}
	}

	return (n + 2) * TIMELINE_ITEM_HEIGHT;
};
