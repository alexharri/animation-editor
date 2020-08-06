import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { DEG_TO_RAD_FAC } from "~/constants";
import { AffineTransform, PropertyGroupName, PropertyName } from "~/types";

const propertyGroupNameToLabel: { [key in keyof typeof PropertyGroupName]: string } = {
	Dimensions: "Dimensions",
	Transform: "Transform",
	Content: "Content",
	Structure: "Structure",
	Modifiers: "Modifiers",
	ArrayModifier: "Array Modifier",
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

export const getLayerArrayModifierTransform = (
	layerId: string,
	compositionState: CompositionState,
): AffineTransform | null => {
	const modifierGroupId = getLayerModifierPropertyGroupId(layerId, compositionState);

	if (!modifierGroupId) {
		return null;
	}

	const modifierGroup = compositionState.properties[modifierGroupId] as CompositionPropertyGroup;

	let transformGroupId: string | undefined;

	outer: for (const propertyId of modifierGroup.properties) {
		const arrModGroup = compositionState.properties[propertyId] as CompositionPropertyGroup;

		if (arrModGroup.name !== PropertyGroupName.ArrayModifier) {
			continue;
		}

		for (let j = 0; j < arrModGroup.properties.length; j += 1) {
			const property = compositionState.properties[arrModGroup.properties[j]];
			if (property.name === PropertyGroupName.Transform) {
				transformGroupId = property.id;
				break outer;
			}
		}
	}

	if (!transformGroupId) {
		return null;
	}

	const transformGroup = compositionState.properties[
		transformGroupId
	] as CompositionPropertyGroup;
	return transformGroup.properties.reduce<AffineTransform>((transform, propertyId) => {
		const property = compositionState.properties[propertyId] as CompositionProperty;

		switch (property.name) {
			case PropertyName.PositionX: {
				if (!transform.translate) {
					transform.translate = Vec2.new(0, 0);
				}
				transform.translate.x = property.value;
				break;
			}
			case PropertyName.PositionY: {
				if (!transform.translate) {
					transform.translate = Vec2.new(0, 0);
				}
				transform.translate.y = property.value;
				break;
			}
			case PropertyName.AnchorX: {
				if (!transform.anchor) {
					transform.anchor = Vec2.new(0, 0);
				}
				transform.anchor.x = property.value;
				break;
			}
			case PropertyName.AnchorY: {
				if (!transform.anchor) {
					transform.anchor = Vec2.new(0, 0);
				}
				transform.anchor.y = property.value;
				break;
			}
			case PropertyName.Rotation: {
				transform.rotation = property.value * DEG_TO_RAD_FAC;
				break;
			}
			case PropertyName.Scale: {
				transform.scale = property.value;
				break;
			}
		}

		return transform;
	}, {} as any);
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
