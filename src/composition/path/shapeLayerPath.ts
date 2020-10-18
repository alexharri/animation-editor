import {
	CompositionProperty,
	CompositionPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { createLayerTransformProperties } from "~/composition/layer/layerTransformProperties";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, ValueFormat, ValueType } from "~/types";

export const createShapeLayerShapeGroup = (pathId: string, opts: CreatePropertyOptions) => {
	const { compositionId, layerId } = opts;

	const propertyId = opts.createId();
	const propertiesToAdd: Array<CompositionProperty | CompositionPropertyGroup> = [];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Shape,
		id: propertyId,
		layerId,
		properties: [],
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};
	propertiesToAdd.push(group);

	const path: CompositionProperty = {
		type: "property",
		name: PropertyName.ShapeLayer_Path,
		valueType: ValueType.Path,
		value: pathId,
		id: opts.createId(),
		compositionId,
		layerId,
		timelineId: "",
		color: TimelineColors.Height,
		twinPropertyId: "",
		shouldMaintainProportions: false,
	};

	group.properties.push(path.id);
	propertiesToAdd.push(path);

	const fillProperties: CompositionProperty[] = [
		{
			type: "property",
			name: PropertyName.RGBAColor,
			valueType: ValueType.RGBColor,
			value: [255, 0, 0],
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			name: PropertyName.FillRule,
			valueType: ValueType.FillRule,
			value: "evenodd",
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			name: PropertyName.Opacity,
			valueType: ValueType.Number,
			value: 1,
			min: 0,
			max: 1,
			valueFormat: ValueFormat.Percentage,
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
	];

	const fillGroup: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Fill,
		id: opts.createId(),
		layerId,
		properties: fillProperties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	group.properties.push(fillGroup.id);
	propertiesToAdd.push(fillGroup, ...fillProperties);

	const strokeProperties: CompositionProperty[] = [
		{
			type: "property",
			name: PropertyName.RGBAColor,
			valueType: ValueType.RGBColor,
			value: [0, 0, 0],
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			name: PropertyName.StrokeWidth,
			valueType: ValueType.Number,
			value: 1,
			min: 0,
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			name: PropertyName.Opacity,
			valueType: ValueType.Number,
			value: 1,
			min: 0,
			max: 1,
			valueFormat: ValueFormat.Percentage,
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			name: PropertyName.LineCap,
			valueType: ValueType.LineCap,
			value: "butt",
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			name: PropertyName.LineJoin,
			valueType: ValueType.LineJoin,
			value: "miter",
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			name: PropertyName.MiterLimit,
			valueType: ValueType.Number,
			value: 4,
			min: 1,
			id: opts.createId(),
			compositionId,
			layerId,
			timelineId: "",
			color: TimelineColors.Height,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
	];

	const strokeGroup: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Stroke,
		id: opts.createId(),
		layerId,
		properties: strokeProperties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	group.properties.push(strokeGroup.id);
	propertiesToAdd.push(strokeGroup, ...strokeProperties);

	const transform = createLayerTransformProperties(opts);

	group.properties.push(transform.group.id);
	propertiesToAdd.push(transform.group, ...transform.properties);

	const pathPropertyId = path.id;

	return { propertyId, pathPropertyId, propertiesToAdd };
};
