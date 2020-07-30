import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { COMP_TIME_BETWEEN_LAYERS, COMP_TIME_LAYER_HEIGHT } from "~/constants";
import { LayerType } from "~/types";

type TrackYPositions = {
	timeline: { [timelineId: string]: number };
	property: { [propertyId: string]: number };
	layer: { [layerId: string]: number };
};

export const getCompTimeTrackYPositions = (
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

export const getCompTimeLayerListHeight = (
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

export const capCompTimePanY = (
	yPan: number,
	compositionId: string,
	viewportHeight: number,
	compositionState: CompositionState,
) => {
	let y = yPan;

	const height = getCompTimeLayerListHeight(compositionId, compositionState);

	y = Math.max(0, Math.min(y, height - viewportHeight));

	return y;
};

export const reduceVisibleLayerProperties = <T>(
	layerId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: CompositionProperty) => T,
	initialState: T,
): T => {
	let acc = initialState;
	const layer = compositionState.layers[layerId];

	const crawlProperty = (propertyId: string) => {
		const property = compositionState.properties[propertyId];

		if (property.type === "group") {
			if (!property.collapsed) {
				for (let j = 0; j < property.properties.length; j += 1) {
					crawlProperty(property.properties[j]);
				}
			}
			return;
		}

		acc = fn(acc, property);
	};

	for (let j = 0; j < layer.properties.length; j += 1) {
		crawlProperty(layer.properties[j]);
	}

	return acc;
};

export const reduceLayerPropertiesAndGroups = <T>(
	layerId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: CompositionProperty | CompositionPropertyGroup) => T,
	initialState: T,
): T => {
	let acc = initialState;
	const layer = compositionState.layers[layerId];

	const crawlProperty = (propertyId: string) => {
		const property = compositionState.properties[propertyId];

		if (property.type === "group") {
			acc = fn(acc, property);
			for (let j = 0; j < property.properties.length; j += 1) {
				crawlProperty(property.properties[j]);
			}
			return;
		}

		acc = fn(acc, property);
	};

	for (let j = 0; j < layer.properties.length; j += 1) {
		crawlProperty(layer.properties[j]);
	}

	return acc;
};

export function reduceLayerProperties<T>(
	layerId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: CompositionProperty) => T,
	initialState: T,
	options: Partial<{ recursive: boolean }> = {},
): T {
	let acc = reduceLayerPropertiesAndGroups(
		layerId,
		compositionState,
		(acc, property) => {
			if (property.type === "property") {
				return fn(acc, property);
			}
			return acc;
		},
		initialState,
	);

	const layer = compositionState.layers[layerId];
	if (options.recursive && layer.type === LayerType.Composition) {
		const compositionId = compositionState.compositionLayerIdToComposition[layer.id];
		acc = reduceCompProperties(compositionId, compositionState, fn, initialState, options);
	}

	return acc;
}

export function reduceCompProperties<T>(
	compositionId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: CompositionProperty) => T,
	initialState: T,
	options: Partial<{ recursive: boolean }> = {},
): T {
	const composition = compositionState.compositions[compositionId];

	let acc = initialState;

	for (let i = 0; i < composition.layers.length; i += 1) {
		acc = reduceLayerProperties(composition.layers[i], compositionState, fn, acc, options);
	}

	return acc;
}

/**
 * Recursive means that we also use Composition layer layers.
 */
// export function reduceCompLayersRecursive<T extends string[] = string[]>(
// 	compositionId: string,
// 	compositionState: CompositionState,
// 	propertyToValue: PropertyValueMap,
// ): { layerIds: T, containerMap: { [layerId: string]: { width: number, height: number } }} {
// 	const composition = compositionState.compositions[compositionId];

// 	const layerIds: string[] = [];
// 	const containerMap: { [layerId: string]: { width: number, height: number } } = {
// 		[compositionId]: {
// 			width: composition.width,
// 			height: composition.height,
// 		}
// 	};

// 	const list = [...composition.layers];

// 	for (let i = 0; i < list.length; i += 1) {
// 		const layer = compositionState.layers[list[i]];

// 		const isCompLayer = layer.type === LayerType.Composition;

// 		if (isCompLayer) {
// 			const item = reduceLayerProperties(
// 				layer.id,
// 				compositionState,
// 				(acc, property) => {
// 					if (property.name === PropertyName.Width) {
// 						acc.width = propertyToValue[property.id].rawValue;
// 					} else if (property.name === PropertyName.Height) {
// 						acc.height = propertyToValue[property.id].rawValue;
// 					}
// 					return acc;
// 				},
// 				{ width: 0, height: 0 },
// 			);

// 		}

// 		acc = fn(acc, layer);

// 		if (isCompLayer) {
// 			const compositionId = compositionState.compositionLayerIdToComposition[layer.id];
// 			const composition = compositionState.compositions[compositionId];
// 			list.push(...composition.layers);
// 		}
// 	}

// 	return {layerIds, containerMap };
// }

export const reduceVisibleCompProperties = <T>(
	compositionId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: CompositionProperty) => T,
	initialState: T,
): T => {
	const composition = compositionState.compositions[compositionId];

	let acc = initialState;

	for (let i = 0; i < composition.layers.length; i += 1) {
		acc = reduceVisibleLayerProperties(composition.layers[i], compositionState, fn, acc);
	}

	return acc;
};

export const getTimelineIdsReferencedByLayer = (
	layerId: string,
	compositionState: CompositionState,
): string[] => {
	return reduceVisibleLayerProperties<string[]>(
		layerId,
		compositionState,
		(acc, property) => {
			property.timelineId && acc.push(property.timelineId);
			return acc;
		},
		[],
	);
};

export const getTimelineIdsReferencedByComposition = (
	compositionId: string,
	compositionState: CompositionState,
): string[] => {
	return reduceCompProperties<string[]>(
		compositionId,
		compositionState,
		(acc, property) => {
			property.timelineId && acc.push(property.timelineId);
			return acc;
		},
		[],
	);
};
