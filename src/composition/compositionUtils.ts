import { CompositionState } from "~/composition/compositionReducer";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { LayerType } from "~/types";

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

export function reduceCompPropertiesAndGroups<T>(
	compositionId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: CompositionProperty | CompositionPropertyGroup) => T,
	initialState: T,
): T {
	const composition = compositionState.compositions[compositionId];

	let acc = initialState;

	for (let i = 0; i < composition.layers.length; i += 1) {
		acc = reduceLayerPropertiesAndGroups<T>(composition.layers[i], compositionState, fn, acc);
	}

	return acc;
}

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
