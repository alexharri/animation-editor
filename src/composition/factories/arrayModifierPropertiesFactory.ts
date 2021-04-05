import {
	CompoundProperty,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { transformPropertiesFactory } from "~/composition/factories/transformPropertiesFactory";
import { CompoundPropertyName, PropertyGroupName, PropertyName } from "~/types";

export const arrayModifierPropertiesFactory = (opts: CreatePropertyOptions) => {
	const propertyId = opts.createId();
	const propertiesToAdd: Array<Property | CompoundProperty | PropertyGroup> = [];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.ArrayModifier,
		id: propertyId,
		layerId: opts.layerId,
		compositionId: opts.compositionId,
		properties: [],
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};
	propertiesToAdd.push(group);

	const transformBehavior: Property = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_TransformBehavior,
		timelineId: "",
		value: "absolute_for_computed",
		compoundPropertyId: "",
	};

	group.properties.push(transformBehavior.id);
	propertiesToAdd.push(transformBehavior);

	const originBehavior: Property = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_OriginBehavior,
		timelineId: "",
		value: "relative",
		compoundPropertyId: "",
	};

	group.properties.push(originBehavior.id);
	propertiesToAdd.push(originBehavior);

	const rotationCorrection: Property = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_RotationCorrection,
		timelineId: "",
		value: 0,
		compoundPropertyId: "",
	};

	group.properties.push(rotationCorrection.id);
	propertiesToAdd.push(rotationCorrection);

	const originX: Property = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_OriginX,
		timelineId: "",
		value: 0,
		compoundPropertyId: "",
	};
	const originY: Property = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_OriginY,
		timelineId: "",
		value: 0,
		compoundPropertyId: "",
	};
	const origin: CompoundProperty = {
		type: "compound",
		id: opts.createId(),
		layerId: opts.layerId,
		compositionId: opts.compositionId,
		name: CompoundPropertyName.ArrayModifier_Origin,
		properties: [originX.id, originY.id],
		separated: false,
		allowMaintainProportions: false,
		maintainProportions: false,
	};

	group.properties.push(origin.id);
	propertiesToAdd.push(origin, originX, originY);

	const count: Property = {
		type: "property",
		id: opts.createId(),
		compositionId: opts.compositionId,
		layerId: opts.layerId,
		name: PropertyName.ArrayModifier_Count,
		timelineId: "",
		value: 1,
		compoundPropertyId: "",
	};

	group.properties.push(count.id);
	propertiesToAdd.push(count);

	const transform = transformPropertiesFactory(opts);

	group.properties.push(transform.group.id);
	propertiesToAdd.push(transform.group, ...transform.properties);

	return { propertyId, propertiesToAdd };
};
