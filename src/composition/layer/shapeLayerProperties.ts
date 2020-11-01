import {
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { PropertyGroupName } from "~/types";

const contentProperties = (opts: CreatePropertyOptions): CreateLayerPropertyGroup => {
	const { createId, layerId, compositionId } = opts;

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Content,
		id: createId(),
		layerId,
		compositionId,
		properties: [],
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	return { properties: [], group };
};

export const createShapeLayerProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	return [contentProperties(opts)];
};
