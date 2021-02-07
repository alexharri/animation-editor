import { CompositionState } from "~/composition/compositionReducer";
import {
	CompoundProperty,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Layer,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { compositionLayerPropertiesFactory } from "~/composition/factories/compositionLayerPropertiesFactory";
import {
	ellipseLayerPropertiesFactory,
	EllipseProperties,
} from "~/composition/factories/ellipseLayerPropertiesFactory";
import {
	lineLayerPropertiesFactory,
	LineProperties,
} from "~/composition/factories/lineLayerPropertiesFactory";
import { modifierPropertyGroupFactory } from "~/composition/factories/modifierPropertyGroupFactory";
import {
	rectLayerPropertiesFactory,
	RectProperties,
} from "~/composition/factories/rectLayerPropertiesFactory";
import {
	createShapeLayerProperties,
	ShapeProperties,
} from "~/composition/factories/shapeLayerPropertiesFactory";
import { transformPropertiesFactory } from "~/composition/factories/transformPropertiesFactory";
import { getLayerTypeName } from "~/composition/layer/layerUtils";
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
			return compositionLayerPropertiesFactory(opts);
		case LayerType.Shape:
			return createShapeLayerProperties(opts, props);
		case LayerType.Rect:
			return rectLayerPropertiesFactory(opts, props);
		case LayerType.Ellipse:
			return ellipseLayerPropertiesFactory(opts, props);
		case LayerType.Line:
			return lineLayerPropertiesFactory(opts, props);
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
		modifierPropertyGroupFactory(opts),
		...getLayerTypeSpecificProperties(type, opts, props),
		transformPropertiesFactory(opts, transform),
	];
};

interface TypeToProps {
	[LayerType.Rect]: RectProperties;
	[LayerType.Ellipse]: EllipseProperties;
	[LayerType.Composition]: {};
	[LayerType.Shape]: ShapeProperties;
	[LayerType.Line]: LineProperties;
}

interface Options<T extends LayerType> {
	type: T;
	compositionId: string;
	compositionState: CompositionState;
	defaultName?: string;
	transform?: LayerTransform;
	props?: Partial<TypeToProps[T]>;
}

export const layerFactory = <T extends LayerType>(options: Options<T>) => {
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
		playbackStartsAtIndex: type === LayerType.Composition ? 0 : -1,
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
