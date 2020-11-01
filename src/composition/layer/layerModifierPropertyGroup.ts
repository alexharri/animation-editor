import {
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { PropertyGroupName } from "~/types";

export const createLayerModifierProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup => {
	const { layerId } = opts;

	const properties: Property[] = [];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Modifiers,
		id: opts.createId(),
		layerId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	return { properties, group };
};
