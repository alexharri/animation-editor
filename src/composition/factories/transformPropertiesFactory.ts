import {
	CompoundProperty,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { DEFAULT_LAYER_TRANSFORM } from "~/constants";
import {
	CompoundPropertyName,
	LayerTransform,
	PropertyGroupName,
	PropertyName,
	ValueType,
} from "~/types";

export const transformPropertiesFactory = (
	opts: CreatePropertyOptions,
	props: LayerTransform = DEFAULT_LAYER_TRANSFORM,
): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;
	const transform = props;

	const positionId = opts.createId();
	const anchorId = opts.createId();
	const scaleId = opts.createId();

	const scaleXId = createId();
	const scaleYId = createId();

	const positionX: Property = {
		type: "property",
		id: createId(),
		layerId,
		compositionId,
		name: PropertyName.PositionX,
		timelineId: "",
		valueType: ValueType.Number,
		value: transform.translate.x,
		compoundPropertyId: positionId,
	};
	const positionY: Property = {
		type: "property",
		id: createId(),
		layerId,
		compositionId,
		name: PropertyName.PositionY,
		timelineId: "",
		valueType: ValueType.Number,
		value: transform.translate.y,
		compoundPropertyId: positionId,
	};
	const position: CompoundProperty = {
		type: "compound",
		id: positionId,
		layerId,
		compositionId: opts.compositionId,
		name: CompoundPropertyName.Position,
		properties: [positionX.id, positionY.id],
		separated: false,
		allowMaintainProportions: false,
		maintainProportions: false,
	};

	const anchorX: Property = {
		type: "property",
		id: createId(),
		layerId,
		compositionId,
		name: PropertyName.AnchorX,
		timelineId: "",
		valueType: ValueType.Number,
		value: transform.anchor.x,
		compoundPropertyId: anchorId,
	};
	const anchorY: Property = {
		type: "property",
		id: createId(),
		layerId,
		compositionId,
		name: PropertyName.AnchorY,
		timelineId: "",
		valueType: ValueType.Number,
		value: transform.anchor.y,
		compoundPropertyId: anchorId,
	};
	const anchor: CompoundProperty = {
		type: "compound",
		id: anchorId,
		layerId,
		compositionId: opts.compositionId,
		name: CompoundPropertyName.Anchor,
		properties: [anchorX.id, anchorY.id],
		separated: false,
		allowMaintainProportions: false,
		maintainProportions: false,
	};

	const scaleX: Property = {
		type: "property",
		id: scaleXId,
		layerId,
		compositionId,
		name: PropertyName.ScaleX,
		timelineId: "",
		valueType: ValueType.Number,
		value: transform.scaleX,
		compoundPropertyId: scaleId,
	};
	const scaleY: Property = {
		type: "property",
		id: scaleYId,
		layerId,
		compositionId,
		name: PropertyName.ScaleY,
		timelineId: "",
		valueType: ValueType.Number,
		value: transform.scaleY,
		compoundPropertyId: scaleId,
	};
	const scale: CompoundProperty = {
		type: "compound",
		id: scaleId,
		layerId,
		compositionId: opts.compositionId,
		name: CompoundPropertyName.Scale,
		properties: [scaleX.id, scaleY.id],
		separated: false,
		allowMaintainProportions: true,
		maintainProportions: true,
	};

	const properties: Array<Property | CompoundProperty> = [
		anchor,
		position,
		scale,
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Rotation,
			timelineId: "",
			valueType: ValueType.Number,
			value: transform.rotation,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Opacity,
			timelineId: "",
			valueType: ValueType.Number,
			value: 1,
			compoundPropertyId: "",
		},
	];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Transform,
		id: opts.createId(),
		layerId,
		compositionId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	const propertiesToAdd = [...properties, positionX, positionY, anchorX, anchorY, scaleX, scaleY];

	return { properties: propertiesToAdd, group };
};
