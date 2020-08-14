import { CompositionState } from "~/composition/compositionReducer";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { getIndexTransformMap } from "~/composition/transformUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import {
	AffineTransform,
	ArrayModifierPropertyValueMap,
	PropertyGroupName,
	PropertyName,
	PropertyValueMap,
	TransformBehavior,
} from "~/types";

const propertyGroupNameToLabel: { [key in keyof typeof PropertyGroupName]: string } = {
	Dimensions: "Dimensions",
	Transform: "Transform",
	Content: "Content",
	Structure: "Structure",
	Modifiers: "Modifiers",
	ArrayModifier: "Array Modifier",
	Shape: "Shape",
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

	ArrayModifier_Count: "Count",
	ArrayModifier_TransformBehavior: "Transform Behavior",

	ShapeLayer_Path: "Path",
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

export const getLayerArrayModifierIndexTransform = (
	compositionState: CompositionState,
	propertyToValue: PropertyValueMap,
	arrayModifierPropertyToValue: ArrayModifierPropertyValueMap,
	count: number,
	transform: AffineTransform,
	transformGroupId: string,
	behavior: TransformBehavior,
): { [index: number]: AffineTransform } => {
	const transformGroup = compositionState.properties[
		transformGroupId
	] as CompositionPropertyGroup;

	const indexTransforms: AffineTransform[] = [];
	const isComputedByIndex: { [key: string]: boolean } = {};

	for (let i = 0; i < count; i += 1) {
		const transform: AffineTransform = {} as any;

		for (const propertyId of transformGroup.properties) {
			const property = compositionState.properties[propertyId];
			const hasComputedByIndex = !!arrayModifierPropertyToValue[propertyId];

			const value = hasComputedByIndex
				? arrayModifierPropertyToValue[propertyId][i]
				: propertyToValue[propertyId].computedValue;

			if (property.type === "property") {
				isComputedByIndex[property.name] = hasComputedByIndex;
			}

			switch (property.name) {
				case PropertyName.PositionX: {
					if (!transform.translate) {
						transform.translate = Vec2.new(0, 0);
					}
					transform.translate.x = value;
					break;
				}
				case PropertyName.PositionY: {
					if (!transform.translate) {
						transform.translate = Vec2.new(0, 0);
					}
					transform.translate.y = value;
					break;
				}
				case PropertyName.AnchorX: {
					if (!transform.anchor) {
						transform.anchor = Vec2.new(0, 0);
					}
					transform.anchor.x = value;
					break;
				}
				case PropertyName.AnchorY: {
					if (!transform.anchor) {
						transform.anchor = Vec2.new(0, 0);
					}
					transform.anchor.y = value;
					break;
				}
				case PropertyName.Rotation: {
					transform.rotation = value * DEG_TO_RAD_FAC;
					break;
				}
				case PropertyName.Scale: {
					transform.scale = value;
					break;
				}
			}
		}

		indexTransforms.push(transform);
	}

	return getIndexTransformMap(transform, indexTransforms, count, isComputedByIndex, behavior);
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
