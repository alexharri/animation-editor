import {
	CompositionLayer,
	CompositionProperty,
	CompositionPropertyGroup,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { createCompLayerProperties } from "~/composition/layer/compLayerProperties";
import { createRectLayerProperties } from "~/composition/layer/rectLayerProperties";
import { createEllipseLayerProperties } from "~/composition/layer/ellipseLayerProperties";
import { LayerType } from "~/types";
import { getLayerTypeName } from "~/composition/layer/layerUtils";
import { CompositionState } from "~/composition/state/compositionReducer";
import { createLayerTransformProperties } from "~/composition/layer/layerTransformProperties";
import { createMapNumberId, createGenMapIdFn } from "~/util/mapUtils";
import { getNonDuplicateName } from "~/util/names";

const getLayerTypeSpecificProperties = (
	type: LayerType,
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	switch (type) {
		case LayerType.Composition:
			return createCompLayerProperties(opts);
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

interface Options {
	defaultName: string;
}

export const createLayer = (
	compositionState: CompositionState,
	type: LayerType,
	compositionId: string,
	options: Partial<Options> = {},
) => {
	const composition = compositionState.compositions[compositionId];
	const existingLayerNames = composition.layers.map((id) => compositionState.layers[id].name);

	const layerId = createMapNumberId(compositionState.layers);

	const propertyGroups = getLayerProperties(type, {
		compositionId,
		layerId,
		createId: createGenMapIdFn(compositionState.properties),
	});

	const nestedProperties: CompositionProperty[] = [];
	const topLevelProperties: CompositionPropertyGroup[] = [];

	for (let i = 0; i < propertyGroups.length; i += 1) {
		const { properties, group } = propertyGroups[i];
		nestedProperties.push(...properties);
		topLevelProperties.push(group);
	}

	const defaultName = options.defaultName ?? getLayerTypeName(type);

	const layer: CompositionLayer = {
		compositionId,
		graphId: "",
		id: layerId,
		index: 0,
		length: composition.length,
		name: getNonDuplicateName(defaultName, existingLayerNames),
		properties: topLevelProperties.map((p) => p.id),
		type,
	};

	return {
		layer,
		propertiesToAdd: [...nestedProperties, ...topLevelProperties],
	};
};
