import {
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { PropertyGroupName } from "~/types";

export const modifierPropertyGroupFactory = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup => {
	const { layerId, compositionId } = opts;
	const properties: Property[] = [];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Modifiers,
		id: opts.createId(),
		layerId,
		compositionId,
		properties: properties.map((p) => p.id),
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	return { properties, group };
};
