import { CompositionState } from "~/composition/compositionReducer";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { PropertyGroupName, PropertyName } from "~/types";

const propertyGroupNameToLabel: { [key in keyof typeof PropertyGroupName]: string } = {
	Dimensions: "Dimensions",
	Transform: "Transform",
	Content: "Content",
	Structure: "Structure",
	Modifiers: "Modifiers",
	ArrayModifier: "Array Modifier",
	Shape: "Shape",
	Fill: "Fill",
	Stroke: "Stroke",
};

const propertyNameToLabel: { [key in keyof typeof PropertyName]: string } = {
	AnchorX: "Anchor X",
	AnchorY: "Anchor Y",
	Scale: "Scale",
	ScaleX: "X Scale",
	ScaleY: "Y Scale",
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

	ArrayModifier_Count: "Count",
	ArrayModifier_TransformBehavior: "Transform Behavior",

	ShapeLayer_Path: "Path",
	RGBAColor: "Color",
	RGBColor: "Color",
	FillRule: "Fill Rule",
	LineCap: "Line Cap",
	LineJoin: "Line Join",
	MiterLimit: "Miter Limit",
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
			// Do not crawl modifiers
			if (property.name !== PropertyGroupName.Modifiers) {
				property.properties.forEach(crawl);
			}
			return;
		}

		properties.push(property);
	}
	compositionState.layers[layerId].properties.forEach(crawl);

	return properties;
}

export const getLayerModifierPropertyGroupId = (
	layerId: string,
	compositionState: CompositionState,
): string | null => {
	const layer = compositionState.layers[layerId];
	const groupNames = layer.properties.map((id) => {
		const property = compositionState.properties[id];

		if (property.type === "property") {
			return null;
		}

		return property.name;
	});

	const index = groupNames.indexOf(PropertyGroupName.Modifiers);

	if (index === -1) {
		return null;
	}

	return layer.properties[index];
};

export const getLayerArrayModifierCountPropertyId = (
	layerId: string,
	compositionState: CompositionState,
): string | null => {
	const modifierGroupId = getLayerModifierPropertyGroupId(layerId, compositionState);

	if (!modifierGroupId) {
		return null;
	}

	const modifierGroup = compositionState.properties[modifierGroupId] as CompositionPropertyGroup;

	for (const propertyId of modifierGroup.properties) {
		const arrayModifierGroup = compositionState.properties[
			propertyId
		] as CompositionPropertyGroup;

		if (arrayModifierGroup.name !== PropertyGroupName.ArrayModifier) {
			continue;
		}

		for (let j = 0; j < arrayModifierGroup.properties.length; j += 1) {
			const property = compositionState.properties[arrayModifierGroup.properties[j]];
			if (property.name === PropertyName.ArrayModifier_Count) {
				return property.id;
			}
		}
	}

	return null;
};

export const getLayerArrayModifiers = (layerId: string, compositionState: CompositionState) => {
	const out: Array<{
		modifierGroupId: string;
		countId: string;
		transformBehaviorId: string;
		transformGroupId: string;
	}> = [];

	const modifierGroupId = getLayerModifierPropertyGroupId(layerId, compositionState);

	if (!modifierGroupId) {
		return out;
	}

	const modifierGroup = compositionState.properties[modifierGroupId] as CompositionPropertyGroup;
	const arrayModifierGroupIds = modifierGroup.properties.filter((propertyId) => {
		const property = compositionState.properties[propertyId];
		return property.name === PropertyGroupName.ArrayModifier;
	});

	for (let i = 0; i < arrayModifierGroupIds.length; i += 1) {
		const group = compositionState.properties[
			arrayModifierGroupIds[i]
		] as CompositionPropertyGroup;

		const names = group.properties.map(
			(propertyId) => compositionState.properties[propertyId].name,
		);
		const countIndex = names.indexOf(PropertyName.ArrayModifier_Count);
		const transformBehaviorIndex = names.indexOf(PropertyName.ArrayModifier_TransformBehavior);
		const transformIndex = names.indexOf(PropertyGroupName.Transform);

		out.push({
			modifierGroupId: group.id,
			countId: group.properties[countIndex],
			transformBehaviorId: group.properties[transformBehaviorIndex],
			transformGroupId: group.properties[transformIndex],
		});
	}

	return out;
};
