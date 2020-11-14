import {
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, RGBColor, ValueType } from "~/types";

export interface RectProperties {
	fill: RGBColor;
	strokeColor: RGBColor;
	strokeWidth: number;
	width: number;
	height: number;
}

const dimensionProperties = (
	opts: CreatePropertyOptions,
	props: Partial<RectProperties>,
): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;
	const { width = 100, height = 100 } = props;

	const properties: Property[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Width,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Width,
			value: width,
			min: 0,
			compoundPropertyId: "",
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
			value: height,
			min: 0,
			compoundPropertyId: "",
		},
	];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Dimensions,
		id: opts.createId(),
		layerId,
		compositionId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	return { properties, group };
};

const contentProperties = (
	opts: CreatePropertyOptions,
	props: Partial<RectProperties>,
): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;
	const { fill = [255, 0, 0], strokeWidth = 0, strokeColor = [0, 0, 255] } = props;

	const properties: Property[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Fill,
			timelineId: "",
			valueType: ValueType.RGBColor,
			color: TimelineColors.Width,
			value: fill,
			min: 0,
			compoundPropertyId: "",
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
			value: strokeWidth,
			min: 0,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.StrokeColor,
			timelineId: "",
			valueType: ValueType.RGBColor,
			color: TimelineColors.Height,
			value: strokeColor,
			min: 0,
			compoundPropertyId: "",
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
			compoundPropertyId: "",
		},
	];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Content,
		id: opts.createId(),
		layerId,
		compositionId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	return { properties, group };
};

export const createRectLayerProperties = (
	opts: CreatePropertyOptions,
	props: Partial<RectProperties> = {},
): CreateLayerPropertyGroup[] => {
	return [dimensionProperties(opts, props), contentProperties(opts, props)];
};
