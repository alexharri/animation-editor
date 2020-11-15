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
import {
	createEllipseLayerProperties,
	EllipseProperties,
} from "~/composition/layer/ellipseLayerProperties";
import { createLayerModifierProperties } from "~/composition/layer/layerModifierPropertyGroup";
import { createLayerTransformProperties } from "~/composition/layer/layerTransformProperties";
import { getLayerTypeName } from "~/composition/layer/layerUtils";
import { createRectLayerProperties, RectProperties } from "~/composition/layer/rectLayerProperties";
import {
	createShapeLayerProperties,
	ShapeProperties,
} from "~/composition/layer/shapeLayerProperties";
import { LayerTransform, LayerType } from "~/types";
import { createGenMapIdFn, createMapNumberId } from "~/util/mapUtils";
import { getNonDuplicateName } from "~/util/names";

const getLayerTypeSpecificProperties = <T extends LayerType>(
	type: T,
	opts: CreatePropertyOptions,
	props: Partial<TypeToProps[T]>,
): CreateLayerPropertyGroup[] => {
	switch (type) {
		case LayerType.Composition:
			return createCompLayerProperties(opts);
		case LayerType.Shape:
			return createShapeLayerProperties(opts, props);
		case LayerType.Rect:
			return createRectLayerProperties(opts, props);
		case LayerType.Ellipse:
			return createEllipseLayerProperties(opts, props);
		default:
			throw new Error(`Invalid layer type '${type}'`);
	}
};

const getLayerProperties = <T extends LayerType>(
	type: T,
	opts: CreatePropertyOptions,
	props: Partial<TypeToProps[T]>,
	transform?: LayerTransform,
): CreateLayerPropertyGroup[] => {
	return [
		createLayerModifierProperties(opts),
		...getLayerTypeSpecificProperties(type, opts, props),
		createLayerTransformProperties(opts, transform),
	];
};

interface TypeToProps {
	[LayerType.Rect]: RectProperties;
	[LayerType.Ellipse]: EllipseProperties;
	[LayerType.Composition]: {};
	[LayerType.Shape]: ShapeProperties;
}

interface Options<T extends LayerType> {
	type: T;
	compositionId: string;
	compositionState: CompositionState;
	defaultName?: string;
	transform?: LayerTransform;
	props?: Partial<TypeToProps[T]>;
}

export const createLayer = <T extends LayerType>(options: Options<T>) => {
	const { compositionId, compositionState, type } = options;

	const composition = compositionState.compositions[compositionId];
	const existingLayerNames = composition.layers.map((id) => compositionState.layers[id].name);

	const layerId = createMapNumberId(compositionState.layers);

	const propertyGroups = getLayerProperties(
		type,
		{
			compositionId,
			layerId,
			createId: createGenMapIdFn(compositionState.properties),
		},
		options.props || {},
		options.transform,
	);

	const nestedProperties: Array<Property | CompoundProperty | PropertyGroup> = [];
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
