import {
	CompositionProperty,
	CompositionPropertyGroup,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, ValueType } from "~/types";

const structureProperties = (opts: CreatePropertyOptions): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;

	const properties: CompositionProperty[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.OuterRadius,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Width,
			value: 50,
			min: 0,
			twinPropertyId: "",
			shouldMaintainProportions: false,
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
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
	];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Structure,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
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
			valueType: ValueType.RGBColor,
			color: TimelineColors.Width,
			value: [255, 0, 0],
			min: 0,
			twinPropertyId: "",
			shouldMaintainProportions: false,
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
			twinPropertyId: "",
			shouldMaintainProportions: false,
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
			value: [0, 0, 255],
			min: 0,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
	];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Content,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	return { properties, group };
};

export const createEllipseLayerProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	return [structureProperties(opts), contentProperties(opts)];
};
