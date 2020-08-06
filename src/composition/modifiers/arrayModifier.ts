import {
	CompositionProperty,
	CompositionPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { createLayerTransformProperties } from "~/composition/layer/layerTransformProperties";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, ValueType } from "~/types";

export const createArrayModifier = (opts: CreatePropertyOptions) => {
	const propertyId = opts.createId();
	const propertiesToAdd: Array<CompositionProperty | CompositionPropertyGroup> = [];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.ArrayModifier,
		id: propertyId,
		layerId: opts.layerId,
		properties: [],
		collapsed: true,
	};
	propertiesToAdd.push(group);

	const transform = createLayerTransformProperties(opts);

	group.properties.push(transform.group.id);
	propertiesToAdd.push(transform.group, ...transform.properties);

	const count: CompositionProperty = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_Count,
		timelineId: "",
		value: 1,
		valueType: ValueType.Number,
		color: TimelineColors.Height,
	};

	group.properties.push(count.id);
	propertiesToAdd.push(count);

	return { propertyId, propertiesToAdd };
};
