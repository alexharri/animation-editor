import { CompositionProperty } from "~/composition/compositionTypes";
import { PropertyName, PropertyGroupName } from "~/types";
import { CompositionState } from "~/composition/state/compositionReducer";

const propertyGroupNameToLabel: { [key in keyof typeof PropertyGroupName]: string } = {
	Dimensions: "Dimensions",
	Transform: "Transform",
	Content: "Content",
	Structure: "Structure",
};

const propertyNameToLabel: { [key in keyof typeof PropertyName]: string } = {
	AnchorX: "Anchor X",
	AnchorY: "Anchor Y",
	Scale: "Scale",
	Rotation: "Rotation",
	PositionX: "X Position",
	PositionY: "Y Position",
	Opacity: "Opacity",

	Height: "Height",
	Width: "Width",
	Fill: "Fill",
	StrokeColor: "Stroke Color",
	StrokeWidth: "Stroke Width",
	BorderRadius: "Border Radius",
	InnerRadius: "Inner Radius",
	OuterRadius: "Outer Radius",
};

export const getLayerPropertyLabel = (name: PropertyName): string => {
	const key = PropertyName[name] as keyof typeof PropertyName;
	return propertyNameToLabel[key];
};

export const getLayerPropertyGroupLabel = (name: PropertyGroupName): string => {
	const key = PropertyGroupName[name] as keyof typeof PropertyGroupName;
	return propertyGroupNameToLabel[key];
};

export function getLayerCompositionProperties(
	layerId: string,
	compositionState: CompositionState,
): CompositionProperty[] {
	const properties: CompositionProperty[] = [];

	function crawl(propertyId: string) {
		const property = compositionState.properties[propertyId];

		if (property.type === "group") {
			property.properties.forEach(crawl);
			return;
		}

		properties.push(property);
	}
	compositionState.layers[layerId].properties.forEach(crawl);

	return properties;
}
