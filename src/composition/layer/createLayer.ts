import {
	CompositionLayer,
	CompositionProperty,
	CompositionPropertyGroup,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { createRectLayerProperties } from "~/composition/layer/rectLayerProperties";
import { createEllipseLayerProperties } from "~/composition/layer/ellipseLayerProperties";
import { LayerType } from "~/types";
import { getLayerTypeName } from "~/composition/layer/layerUtils";
import { CompositionState } from "~/composition/state/compositionReducer";
import { createLayerTransformProperties } from "~/composition/layer/layerTransformProperties";

const getNonDuplicateLayerName = (name: string, existingNames: string[]): string => {
	const names = new Set(existingNames);

	if (!names.has(name)) {
		return name;
	}

	let i = 1;
	while (names.has(`${name} ${i}`)) {
		i++;
	}
	return `${name} ${i}`;
};

const createLayerId = (existingLayerIds: string[]): string =>
	(
		Math.max(0, ...existingLayerIds.map((x) => parseInt(x)).filter((x) => !isNaN(x))) + 1
	).toString();

const createPropertyIdFn = (existingPropertyIds: string[]): (() => string) => {
	let n = 0;
	return () => {
		n++;
		return (
			Math.max(0, ...existingPropertyIds.map((x) => parseInt(x)).filter((x) => !isNaN(x))) + n
		).toString();
	};
};

const getLayerTypeSpecificProperties = (
	type: LayerType,
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	switch (type) {
		case LayerType.Rect:
			return createRectLayerProperties(opts);
		case LayerType.Ellipse:
			return createEllipseLayerProperties(opts);
	}
};

const getLayerProperties = (
	type: LayerType,
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	return [...getLayerTypeSpecificProperties(type, opts), createLayerTransformProperties(opts)];
};

export const createLayer = (
	compositionState: CompositionState,
	type: LayerType,
	compositionId: string,
) => {
	const composition = compositionState.compositions[compositionId];
	const existingLayerIds = Object.keys(compositionState.layers);
	const existingPropertyIds = Object.keys(compositionState.properties);
	const existingLayerNames = composition.layers.map((id) => compositionState.layers[id].name);

	const layerId = createLayerId(existingLayerIds);

	const propertyGroups = getLayerProperties(type, {
		compositionId,
		layerId,
		createId: createPropertyIdFn(existingPropertyIds),
	});

	const nestedProperties: CompositionProperty[] = [];
	const topLevelProperties: CompositionPropertyGroup[] = [];

	for (let i = 0; i < propertyGroups.length; i += 1) {
		const { properties, group } = propertyGroups[i];
		nestedProperties.push(...properties);
		topLevelProperties.push(group);
	}

	const defaultName = getLayerTypeName(type);

	const layer: CompositionLayer = {
		compositionId,
		graphId: "",
		id: layerId,
		index: 0,
		length: composition.length,
		name: getNonDuplicateLayerName(defaultName, existingLayerNames),
		properties: topLevelProperties.map((p) => p.id),
		type,
	};

	return {
		layer,
		propertiesToAdd: [...nestedProperties, ...topLevelProperties],
	};
};
