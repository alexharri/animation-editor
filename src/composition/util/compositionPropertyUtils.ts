import { compositionConstants } from "~/composition/compositionConstants";
import { CompositionState } from "~/composition/compositionReducer";
import { CompoundProperty, Property, PropertyGroup } from "~/composition/compositionTypes";
import { CompoundPropertyName, PropertyGroupName, PropertyName } from "~/types";

export const getLayerPropertyLabel = (name: PropertyName): string => {
	const key = PropertyName[name] as keyof typeof PropertyName;
	return compositionConstants.propertyNameToLabel[key];
};

export const getLayerCompoundPropertyLabel = (name: CompoundPropertyName): string => {
	const key = CompoundPropertyName[name] as keyof typeof CompoundPropertyName;
	return compositionConstants.compoundPropertyNameToLabel[key];
};

export const getLayerPropertyGroupLabel = (name: PropertyGroupName): string => {
	const key = PropertyGroupName[name] as keyof typeof PropertyGroupName;
	return compositionConstants.propertyGroupNameToLabel[key];
};

export function getLayerCompositionProperties(
	layerId: string,
	compositionState: CompositionState,
): Property[] {
	const properties: Property[] = [];

	function crawl(propertyId: string) {
		const property = compositionState.properties[propertyId];

		if (property.type === "group") {
			// Do not crawl modifiers
			if (property.name !== PropertyGroupName.Modifiers) {
				property.properties.forEach(crawl);
			}
			return;
		}

		if (property.type === "compound") {
			property.properties.forEach(crawl);
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

	const modifierGroup = compositionState.properties[modifierGroupId] as PropertyGroup;

	for (const propertyId of modifierGroup.properties) {
		const arrayModifierGroup = compositionState.properties[propertyId] as PropertyGroup;

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
		rotationCorrectionId: string;
		xOriginId: string;
		yOriginId: string;
		originBehaviorId: string;
		transformBehaviorId: string;
		transformGroupId: string;
	}> = [];

	const modifierGroupId = getLayerModifierPropertyGroupId(layerId, compositionState);

	if (!modifierGroupId) {
		return out;
	}

	const modifierGroup = compositionState.properties[modifierGroupId] as PropertyGroup;
	const arrayModifierGroupIds = modifierGroup.properties.filter((propertyId) => {
		const property = compositionState.properties[propertyId];
		return property.name === PropertyGroupName.ArrayModifier;
	});

	for (let i = 0; i < arrayModifierGroupIds.length; i += 1) {
		const group = compositionState.properties[arrayModifierGroupIds[i]] as PropertyGroup;

		const names = group.properties.map(
			(propertyId) => compositionState.properties[propertyId].name,
		);
		const countIndex = names.indexOf(PropertyName.ArrayModifier_Count);
		const rotationCorrectionIndex = names.indexOf(
			PropertyName.ArrayModifier_RotationCorrection,
		);
		const originBehaviorIndex = names.indexOf(PropertyName.ArrayModifier_OriginBehavior);
		const transformBehaviorIndex = names.indexOf(PropertyName.ArrayModifier_TransformBehavior);
		const transformIndex = names.indexOf(PropertyGroupName.Transform);

		const originIndex = names.indexOf(CompoundPropertyName.ArrayModifier_Origin);
		const origin = compositionState.properties[
			group.properties[originIndex]
		] as CompoundProperty;
		const [xOriginId, yOriginId] = origin.properties;

		out.push({
			modifierGroupId: group.id,
			countId: group.properties[countIndex],
			rotationCorrectionId: group.properties[rotationCorrectionIndex],
			xOriginId,
			yOriginId,
			originBehaviorId: group.properties[originBehaviorIndex],
			transformBehaviorId: group.properties[transformBehaviorIndex],
			transformGroupId: group.properties[transformIndex],
		});
	}

	return out;
};
