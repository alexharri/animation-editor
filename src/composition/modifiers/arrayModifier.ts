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
		graphId: "",
	};
	propertiesToAdd.push(group);

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
		twinPropertyId: "",
		shouldMaintainProportions: false,
	};

	group.properties.push(count.id);
	propertiesToAdd.push(count);

	const transformBehavior: CompositionProperty = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_TransformBehavior,
		timelineId: "",
		value: "absolute_for_computed",
		valueType: ValueType.TransformBehavior,
		color: TimelineColors.Height,
		twinPropertyId: "",
		shouldMaintainProportions: false,
	};

	group.properties.push(transformBehavior.id);
	propertiesToAdd.push(transformBehavior);

	const transform = createLayerTransformProperties(opts);

	group.properties.push(transform.group.id);
	propertiesToAdd.push(transform.group, ...transform.properties);

	return { propertyId, propertiesToAdd };
};
