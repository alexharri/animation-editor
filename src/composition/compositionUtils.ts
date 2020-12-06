import { CompositionState } from "~/composition/compositionReducer";
import { CompoundProperty, Property, PropertyGroup } from "~/composition/compositionTypes";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { getActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";

export const reduceVisibleLayerProperties = <T>(
	layerId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: Property) => T,
	initialState: T,
): T => {
	let acc = initialState;
	const layer = compositionState.layers[layerId];

	const crawlProperty = (propertyId: string) => {
		const property = compositionState.properties[propertyId];

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
			property.properties.forEach(crawlProperty);
			return;
		}

		acc = fn(acc, property);
	};

	let { collapsed, properties } = layer;

	if (layer.viewProperties.length) {
		collapsed = false;
		properties = layer.viewProperties;
	}

	if (collapsed) {
		return acc;
	}

	for (let j = 0; j < properties.length; j += 1) {
		crawlProperty(properties[j]);
	}

	return acc;
};

export const reduceLayerPropertiesAndGroups = <T>(
	layerId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: Property | PropertyGroup) => T,
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

		if (property.type === "compound") {
			property.properties.forEach(crawlProperty);
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
	fn: (acc: T, property: Property) => T,
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
	fn: (acc: T, property: Property) => T,
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

export function findCompProperty(
	compositionId: string,
	compositionState: CompositionState,
	fn: (property: Property) => boolean,
): Property | null {
	const composition = compositionState.compositions[compositionId];

	function crawl(propertyId: string): Property | null {
		const property = compositionState.properties[propertyId];

		if (property.type === "group" || property.type === "compound") {
			for (const propertyId of property.properties) {
				const property = crawl(propertyId);
				if (property) {
					return property;
				}
			}

			return null;
		}

		return fn(property) ? property : null;
	}

	for (const layerId of composition.layers) {
		const propertyIds = compositionState.layers[layerId].properties;
		for (const propertyId of propertyIds) {
			const property = crawl(propertyId);
			if (property) {
				return property;
			}
		}
	}

	return null;
}

export function reduceCompPropertiesAndGroups<T>(
	compositionId: string,
	compositionState: CompositionState,
	fn: (acc: T, property: Property | PropertyGroup) => T,
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
	fn: (acc: T, property: Property) => T,
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

export const getPropertyIdsRecursive = (
	propertyId: string,
	compositionState: CompositionState,
): string[] => {
	const propertyIds: string[] = [];
	function crawl(propertyId: string) {
		propertyIds.push(propertyId);
		const property = compositionState.properties[propertyId];
		if (property.type === "group") {
			property.properties.forEach(crawl);
		}
	}
	crawl(propertyId);
	return propertyIds;
};

export const findLayerProperty = <T extends Property | CompoundProperty | PropertyGroup>(
	layerId: string,
	compositionState: CompositionState,
	fn: (property: Property | CompoundProperty | PropertyGroup) => boolean,
): T | null => {
	const layer = compositionState.layers[layerId];

	function crawl(propertyId: string): T | null {
		const property = compositionState.properties[propertyId];

		if (fn(property)) {
			return property as T;
		}

		if (property.type === "group") {
			for (const propertyId of property.properties) {
				const property = crawl(propertyId);
				if (property) {
					return property;
				}
			}
		}

		return null;
	}

	for (const propertyId of layer.properties) {
		const property = crawl(propertyId);
		if (property) {
			return property;
		}
	}

	return null;
};

export const getChildPropertyIdsRecursive = (
	propertyId: string,
	compositionState: CompositionState,
): string[] => {
	const propertyIds: string[] = [];

	function crawl(propertyId: string, add = true) {
		if (add) {
			propertyIds.push(propertyId);
		}

		const property = compositionState.properties[propertyId];
		if (property.type === "group") {
			property.properties.forEach((propertyId) => crawl(propertyId));
		}
	}

	crawl(propertyId, false);

	return propertyIds;
};

export const getParentPropertyInLayer = (
	layerId: string,
	propertyId: string,
	compositionState: CompositionState,
): PropertyGroup | null => {
	return findLayerProperty(layerId, compositionState, (group) => {
		return group.type === "group" && group.properties.indexOf(propertyId) !== -1;
	});
};

export const compUtil = {
	getSelectedLayers: (compositionId: string) => {
		const { compositionState, compositionSelectionState } = getActionState();
		const composition = compositionState.compositions[compositionId];
		const compositionSelection = compSelectionFromState(
			compositionId,
			compositionSelectionState,
		);
		return composition.layers.filter((layerId) => compositionSelection.layers[layerId]);
	},
};
