import {
	CompositionPropertyGroup,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
} from "~/composition/compositionTypes";
import { PropertyGroupName } from "~/types";

const contentProperties = (opts: CreatePropertyOptions): CreateLayerPropertyGroup => {
	const { createId, layerId } = opts;

	const group: CompositionPropertyGroup = {
		type: "group",
		name: PropertyGroupName.Content,
		id: createId(),
		layerId,
		properties: [],
		collapsed: true,
		graphId: "",
	};

	return { properties: [], group };
};

export const createShapeLayerProperties = (
	opts: CreatePropertyOptions,
): CreateLayerPropertyGroup[] => {
	return [contentProperties(opts)];
};
