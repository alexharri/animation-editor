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
			twinPropertyId: "",
			shouldMaintainProportions: false,
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
			twinPropertyId: "",
			shouldMaintainProportions: false,
		},
	];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Dimensions,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
	};

	return { properties, group };
};

export const createCompLayerProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	return [dimensionProperties(opts)];
};
