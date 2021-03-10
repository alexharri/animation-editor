import {
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { TimelineColors } from "~/constants";
import { LineCap, PropertyGroupName, PropertyName, RGBAColor, ValueType } from "~/types";

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
			valueType: ValueType.Number,
			color: TimelineColors.Width,
			value: width,
			min: 0,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.StrokeWidth,
			timelineId: "",
			valueType: ValueType.Number,
			color: TimelineColors.Height,
			value: strokeWidth,
			min: 0,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.StrokeColor,
			timelineId: "",
			valueType: ValueType.RGBAColor,
			color: TimelineColors.Height,
			value: strokeColor,
			min: 0,
			compoundPropertyId: "",
		},
		{
			type: "property",
			id: createId(),
			layerId,
			compositionId,
			name: PropertyName.LineCap,
			timelineId: "",
			valueType: ValueType.LineCap,
			color: TimelineColors.Height,
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
