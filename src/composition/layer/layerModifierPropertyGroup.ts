import {
	CompositionProperty,
	CompositionPropertyGroup,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { PropertyGroupName } from "~/types";

export const createLayerModifierProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup => {
	const { layerId } = opts;

	const properties: CompositionProperty[] = [];

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Modifiers,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
	};

	return { properties, group };
};
