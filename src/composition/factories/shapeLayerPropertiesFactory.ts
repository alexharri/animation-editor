import {
	CompoundProperty,
	CreateLayerPropertyGroup,
	CreatePropertyOptions,
	Property,
	PropertyGroup,
} from "~/composition/compositionTypes";
import { createShapeLayerShapeGroup } from "~/composition/factories/shapeLayerPathPropertiesFactory";
import { FillRule, LineCap, LineJoin, PropertyGroupName, RGBAColor } from "~/types";

export interface ShapeProperties {
	shapes: Array<{
		pathIds: string[];
		fill?: RGBAColor;
		fillOpacity?: number;
		fillRule?: FillRule;
		strokeColor?: RGBAColor;
		strokeWidth?: number;
		lineCap?: LineCap;
		lineJoin?: LineJoin;
		miterLimit?: number;
	}>;
}

const contentProperties = (
	opts: CreatePropertyOptions,
	props: Partial<ShapeProperties>,
): CreateLayerPropertyGroup => {
	const { createId, layerId, compositionId } = opts;

	const properties: Array<Property | CompoundProperty | PropertyGroup> = [];
	const propertyIds: string[] = [];

	const { shapes = [] } = props;

	for (const shape of shapes) {
		const result = createShapeLayerShapeGroup(shape.pathIds, opts, shape);
		properties.push(...result.propertiesToAdd);
		propertyIds.push(result.propertyId);
	}

	const group: PropertyGroup = {
		type: "group",
		name: PropertyGroupName.Content,
		id: createId(),
		layerId,
		compositionId,
		properties: propertyIds,
		collapsed: true,
		graphId: "",
		viewProperties: [],
	};

	return { properties, group };
};

export const createShapeLayerProperties = (
	opts: CreatePropertyOptions,
	props: Partial<ShapeProperties> = {},
): CreateLayerPropertyGroup[] => {
	return [contentProperties(opts, props)];
};
