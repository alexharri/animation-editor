import {
	CompositionProperty,
	CompositionPropertyGroup,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, ValueType } from "~/types";

const dimensionProperties = (opts: CreatePropertyOptions): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;

	const properties: CompositionProperty[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Width,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Width,
			value: 100,
			min: 0,
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Height,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Height,
			value: 100,
			min: 0,
		},
	];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Dimensions,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
	};

	return { properties, group };
};

const contentProperties = (opts: CreatePropertyOptions): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;

	const properties: CompositionProperty[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Fill,
			timelineId: "",
			valueType: ValueType.Color,
			color: TimelineColors.Width,
			value: [255, 0, 0],
			min: 0,
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.StrokeWidth,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Height,
			value: 0,
			min: 0,
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.StrokeColor,
			timelineId: "",
			valueType: ValueType.Color,
			color: TimelineColors.Height,
			value: [0, 0, 255],
			min: 0,
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.BorderRadius,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Height,
			value: 0,
			min: 0,
		},
	];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Content,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
	};

	return { properties, group };
};

export const createRectLayerProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	return [dimensionProperties(opts), contentProperties(opts)];
};
