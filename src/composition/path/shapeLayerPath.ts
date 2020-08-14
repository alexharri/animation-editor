import {
	CompositionProperty,
	CompositionPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { createLayerTransformProperties } from "~/composition/layer/layerTransformProperties";
import { TimelineColors } from "~/constants";
import { PropertyGroupName, PropertyName, ValueType } from "~/types";

export const createShapeLayerShape = (shapeId: string, opts: CreatePropertyOptions) => {
	const propertyId = opts.createId();
	const propertiesToAdd: Array<CompositionProperty | CompositionPropertyGroup> = [];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Shape,
		id: propertyId,
		layerId: opts.layerId,
		properties: [],
		collapsed: true,
		graphId: "",
	};
	propertiesToAdd.push(group);

	const shape: CompositionProperty = {
		type: "property",
		name: PropertyName.ShapeLayer_Path,
		valueType: ValueType.ShapeReference,
		value: shapeId,
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		timelineId: "",
		color: TimelineColors.Height,
	};

	group.properties.push(shape.id);
	propertiesToAdd.push(shape);

	const transform = createLayerTransformProperties(opts);

	group.properties.push(transform.group.id);
	propertiesToAdd.push(transform.group, ...transform.properties);

	return { propertyId, propertiesToAdd };
};
