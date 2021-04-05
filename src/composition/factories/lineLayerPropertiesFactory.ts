import {
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { LineCap, PropertyGroupName, PropertyName, RGBAColor } from "~/types";

export interface LineProperties {
	strokeColor: RGBAColor;
	strokeWidth: number;
	width: number;
	lineCap: LineCap;
}

const contentProperties = (
	opts: CreatePropertyOptions,
	props: Partial<LineProperties>,
): CreateLayerPropertyGroup => {
	const { compositionId, createId, layerId } = opts;
	const { strokeWidth = 0, strokeColor = [0, 0, 0, 1], lineCap = "butt", width = 100 } = props;

	const properties: Property[] = [
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.Width,
			timelineId: "",
			value: width,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.StrokeWidth,
			timelineId: "",
			value: strokeWidth,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.StrokeColor,
			timelineId: "",
			value: strokeColor,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.LineCap,
			timelineId: "",
			value: lineCap,
			compoundPropertyId: "",
		},
	];

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Content,
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

export const lineLayerPropertiesFactory = (
	opts: CreatePropertyOptions,
	props: Partial<LineProperties> = {},
): CreateLayerPropertyGroup[] => {
	return [contentProperties(opts, props)];
};
