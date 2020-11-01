import {
	CompoundProperty,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";
import { CompoundPropertyName, PropertyGroupName, PropertyName, ValueType } from "~/types";

export const createLayerTransformProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;

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
		value: 0,
		color: TimelineColors.XPosition,
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
		value: 0,
		color: TimelineColors.YPosition,
		compoundPropertyId: positionId,
	};
	const position: CompoundProperty = {
		type: "compound",
		animated: false,
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
		value: 0,
		color: TimelineColors.XPosition,
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
		value: 0,
		color: TimelineColors.YPosition,
		compoundPropertyId: anchorId,
	};
	const anchor: CompoundProperty = {
		type: "compound",
		animated: false,
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
		value: 1,
		color: TimelineColors.YPosition,
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
		value: 1,
		color: TimelineColors.YPosition,
		compoundPropertyId: scaleId,
	};
	const scale: CompoundProperty = {
		type: "compound",
		animated: false,
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
			value: 0,
			color: TimelineColors.YPosition,
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
			color: TimelineColors.YPosition,
			max: 1,
			min: 0,
			compoundPropertyId: "",
		},
	];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Transform,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	const propertiesToAdd = [...properties, positionX, positionY, anchorX, anchorY, scaleX, scaleY];

	return { properties: propertiesToAdd, group };
};
