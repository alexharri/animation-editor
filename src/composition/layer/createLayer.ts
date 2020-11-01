import { CompositionState } from "~/composition/compositionReducer";
import {
	CompoundProperty,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Layer,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { createCompLayerProperties } from "~/composition/layer/compLayerProperties";
import { createEllipseLayerProperties } from "~/composition/layer/ellipseLayerProperties";
import { createLayerModifierProperties } from "~/composition/layer/layerModifierPropertyGroup";
import { createLayerTransformProperties } from "~/composition/layer/layerTransformProperties";
import { getLayerTypeName } from "~/composition/layer/layerUtils";
import { createRectLayerProperties } from "~/composition/layer/rectLayerProperties";
import { createShapeLayerProperties } from "~/composition/layer/shapeLayerProperties";
import { LayerType } from "~/types";
import { createGenMapIdFn, createMapNumberId } from "~/util/mapUtils";
import { getNonDuplicateName } from "~/util/names";

const getLayerTypeSpecificProperties = (
	type: LayerType,
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	switch (type) {
		case LayerType.Composition:
			return createCompLayerProperties(opts);
		case LayerType.Shape:
			return createShapeLayerProperties(opts);
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
	return [
		createLayerModifierProperties(opts),
		...getLayerTypeSpecificProperties(type, opts),
		createLayerTransformProperties(opts),
	];
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

	const nestedProperties: Array<Property | CompoundProperty> = [];
	const topLevelProperties: PropertyGroup[] = [];

	for (let i = 0; i < propertyGroups.length; i += 1) {
		const { properties, group } = propertyGroups[i];
		nestedProperties.push(...properties);
		topLevelProperties.push(group);
	}

	const defaultName = options.defaultName ?? getLayerTypeName(type);

	const layer: Layer = {
		compositionId,
		graphId: "",
		id: layerId,
		index: 0,
		length: composition.length,
		name: getNonDuplicateName(defaultName, existingLayerNames),
		properties: topLevelProperties.map((p) => p.id),
		type,
		collapsed: true,
		parentLayerId: "",
		viewProperties: [],
	};

	return {
		layer,
		propertiesToAdd: [...nestedProperties, ...topLevelProperties],
	};
};
