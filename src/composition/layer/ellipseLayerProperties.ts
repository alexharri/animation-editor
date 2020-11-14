import {
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, RGBColor, ValueType } from "~/types";

export interface EllipseProperties {
	fill: RGBColor;
	strokeColor: RGBColor;
	strokeWidth: number;
	radius: number;
}

const structureProperties = (
	opts: CreatePropertyOptions,
	props: Partial<EllipseProperties>,
): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;
	const { radius = 50 } = props;

	const properties: Property[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.OuterRadius,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Width,
			value: radius,
			min: 0,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.InnerRadius,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Width,
			value: 0,
			min: 0,
			compoundPropertyId: "",
		},
	];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Structure,
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
	props: Partial<EllipseProperties>,
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

export const createEllipseLayerProperties = (
	opts: CreatePropertyOptions,
	props: Partial<EllipseProperties> = {},
): CreateLayerPropertyGroup[] => {
	return [structureProperties(opts, props), contentProperties(opts, props)];
};
