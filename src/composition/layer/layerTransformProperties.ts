import {
	CompositionProperty,
	CompositionPropertyGroup,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, ValueType } from "~/types";

export const createLayerTransformProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;

	const scaleXId = createId();
	const scaleYId = createId();

	const properties: CompositionProperty[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.AnchorX,
			timelineId: "",
			valueType: ValueType.Number,
			value: 0,
			color: TimelineColors.XPosition,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.AnchorY,
			timelineId: "",
			valueType: ValueType.Number,
			value: 0,
			color: TimelineColors.YPosition,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.PositionX,
			timelineId: "",
			valueType: ValueType.Number,
			value: 0,
			color: TimelineColors.XPosition,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.PositionY,
			timelineId: "",
			valueType: ValueType.Number,
			value: 0,
			color: TimelineColors.YPosition,
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
		{
			type: "property",
			id: scaleXId,
			layerId,
			compositionId,
			name: PropertyName.ScaleX,
			timelineId: "",
			valueType: ValueType.Number,
			value: 1,
			color: TimelineColors.YPosition,
			twinPropertyId: scaleYId,
			shouldMaintainProportions: true,
		},
		{
			type: "property",
			id: scaleYId,
			layerId,
			compositionId,
			name: PropertyName.ScaleY,
			timelineId: "",
			valueType: ValueType.Number,
			value: 1,
			color: TimelineColors.YPosition,
			twinPropertyId: scaleXId,
			shouldMaintainProportions: true,
		},
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
			twinPropertyId: "",
			shouldMaintainProportions: false,
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
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
	];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Transform,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
	};

	return { properties, group };
};
