import { compositionConstants } from "~/composition/compositionConstants";
import { CompositionState } from "~/composition/compositionReducer";
import { CompoundProperty, PropertyGroup } from "~/composition/compositionTypes";
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

interface ArrayModifierInfo {
	modifierGroupId: string;
	countId: string;
	rotationCorrectionId: string;
	xOriginId: string;
	yOriginId: string;
	originBehaviorId: string;
	transformBehaviorId: string;
	transformGroupId: string;
}

export const getArrayModifierInfo = (
	arrayModifierGroupId: string,
	compositionState: CompositionState,
): ArrayModifierInfo => {
	const group = compositionState.properties[arrayModifierGroupId] as PropertyGroup;

	const names = group.properties.map(
		(propertyId) => compositionState.properties[propertyId].name,
	);
	const countIndex = names.indexOf(PropertyName.ArrayModifier_Count);
	const rotationCorrectionIndex = names.indexOf(PropertyName.ArrayModifier_RotationCorrection);
	const originBehaviorIndex = names.indexOf(PropertyName.ArrayModifier_OriginBehavior);
	const transformBehaviorIndex = names.indexOf(PropertyName.ArrayModifier_TransformBehavior);
	const transformIndex = names.indexOf(PropertyGroupName.Transform);

	const originIndex = names.indexOf(CompoundPropertyName.ArrayModifier_Origin);
	const origin = compositionState.properties[group.properties[originIndex]] as CompoundProperty;
	const [xOriginId, yOriginId] = origin.properties;

	return {
		modifierGroupId: group.id,
		countId: group.properties[countIndex],
		rotationCorrectionId: group.properties[rotationCorrectionIndex],
		xOriginId,
		yOriginId,
		originBehaviorId: group.properties[originBehaviorIndex],
		transformBehaviorId: group.properties[transformBehaviorIndex],
		transformGroupId: group.properties[transformIndex],
	};
};

export const getLayerArrayModifiers = (layerId: string, compositionState: CompositionState) => {
	const out: ArrayModifierInfo[] = [];

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
		out.push(getArrayModifierInfo(arrayModifierGroupIds[i], compositionState));
	}

	return out;
};
