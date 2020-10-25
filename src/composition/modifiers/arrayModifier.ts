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
		viewProperties: [],
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

	const originBehavior: CompositionProperty = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_OriginBehavior,
		timelineId: "",
		value: "relative",
		valueType: ValueType.OriginBehavior,
		color: TimelineColors.Height,
		twinPropertyId: "",
		shouldMaintainProportions: false,
	};

	group.properties.push(originBehavior.id);
	propertiesToAdd.push(originBehavior);

	const rotationCorrection: CompositionProperty = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_RotationCorrection,
		timelineId: "",
		value: 0,
		valueType: ValueType.Number,
		color: TimelineColors.Height,
		twinPropertyId: "",
		shouldMaintainProportions: false,
	};

	group.properties.push(rotationCorrection.id);
	propertiesToAdd.push(rotationCorrection);

	const originX: CompositionProperty = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_OriginX,
		timelineId: "",
		value: 0,
		valueType: ValueType.Number,
		color: TimelineColors.XPosition,
		twinPropertyId: "",
		shouldMaintainProportions: false,
	};
	const originY: CompositionProperty = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_OriginY,
		timelineId: "",
		value: 0,
		valueType: ValueType.Number,
		color: TimelineColors.XPosition,
		twinPropertyId: "",
		shouldMaintainProportions: false,
	};

	group.properties.push(originX.id, originY.id);
	propertiesToAdd.push(originX, originY);

	const transform = createLayerTransformProperties(opts);

	group.properties.push(transform.group.id);
	propertiesToAdd.push(transform.group, ...transform.properties);

	return { propertyId, propertiesToAdd };
};
