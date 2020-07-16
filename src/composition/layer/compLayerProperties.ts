import { PropertyName, ValueType, PropertyGroupName } from "~/types";
import {
	CompositionProperty,
	CreatePropertyOptions,
	CreateLayerPropertyGroup,
	CompositionPropertyGroup,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";

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
		properties: properties.map((p) => p.id),
		collapsed: true,
	};

	return { properties, group };
};

export const createCompLayerProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	return [dimensionProperties(opts)];
};
