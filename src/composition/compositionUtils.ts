import { CompositionState } from "~/composition/compositionReducer";
import { CompoundProperty, Property, PropertyGroup } from "~/composition/compositionTypes";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { getActionState } from "~/state/stateUtils";
import { LayerType, PropertyGroupName } from "~/types";

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

export function forEachLayerProperty(
	layerId: string,
	compositionState: CompositionState,
	fn: (property: Property) => void,
	options: { ignoreGroups?: PropertyGroupName[] } = {},
): void {
	const groupsToIgnore = new Set<PropertyGroupName>();

	if (options.ignoreGroups) {
		options.ignoreGroups.forEach((name) => groupsToIgnore.add(name));
	}

	const toIterateOver = [...compositionState.layers[layerId].properties];
	while (toIterateOver.length) {
		const propertyId = toIterateOver[0];
		const property = compositionState.properties[propertyId];

		if (property.type === "group" && groupsToIgnore.has(property.name)) {
			toIterateOver.shift();
			continue;
		}

		if (property.type === "property") {
			fn(property);
		} else {
			toIterateOver.push(...property.properties);
		}
		toIterateOver.shift();
	}
}

export function forEachSubProperty(
	_propertyId: string,
	compositionState: CompositionState,
	fn: (property: Property) => void,
): void {
	const property = compositionState.properties[_propertyId];

	if (property.type === "property") {
		throw new Error(`Property of type "property" has no sub-properties.`);
	}

	const toIterateOver = [...property.properties];
	while (toIterateOver.length) {
		const propertyId = toIterateOver[0];
		const property = compositionState.properties[propertyId];

		if (property.type === "property") {
			fn(property);
		} else {
			toIterateOver.push(...property.properties);
		}
		toIterateOver.shift();
	}
}

export function findDirectSubProperty(
	propertyId: string,
	compositionState: CompositionState,
	fn: (property: Property) => boolean,
): Property | null {
	const property = compositionState.properties[propertyId];

	if (property.type === "property") {
		throw new Error(`Property of type "property" has no sub-properties.`);
	}

	const toIterateOver = [...property.properties];
	for (let i = 0; i < property.properties.length; i++) {
		const propertyId = toIterateOver[i];
		const property = compositionState.properties[propertyId];

		if (property.type === "property") {
			const found = fn(property);
			if (found) {
				return property;
			}
		} else {
			toIterateOver.push(...property.properties);
		}
		toIterateOver.shift();
	}

	return null;
}

export function forEachLayerPropertyAndCompoundProperty(
	layerId: string,
	compositionState: CompositionState,
	fn: (property: Property | CompoundProperty) => void,
): void {
	const toIterateOver = [...compositionState.layers[layerId].properties];
	while (toIterateOver.length) {
		const propertyId = toIterateOver[0];
		const property = compositionState.properties[propertyId];

		if (property.type === "property") {
			fn(property);
		} else if (property.type === "compound") {
			fn(property);
			toIterateOver.push(...property.properties);
		} else {
			toIterateOver.push(...property.properties);
		}
		toIterateOver.shift();
	}
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

export const findLayerTopLevelPropertyGroup = (
	layerId: string,
	compositionState: CompositionState,
	name: PropertyGroupName,
): PropertyGroup => {
	const layer = compositionState.layers[layerId];

	for (const propertyId of layer.properties) {
		const property = compositionState.properties[propertyId];
		if (property.name === name) {
			return property;
		}
	}

	throw new Error(`Could not find group with name '${name}' on layer '${layerId}'.`);
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
