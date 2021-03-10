import { Property, PropertyGroup } from "~/composition/compositionTypes";
import { forEachSubProperty } from "~/composition/compositionUtils";
import { CompoundPropertyName, Performable, PropertyGroupName, PropertyName } from "~/types";

const EMPTY_STR_SET = new Set<string>();

interface PropertyInfo {
	/**
	 * Which action to perform when the property's value is updated.
	 */
	performable: Performable;

	/**
	 * Whether the property should be updated when the frame index changes.
	 */
	isAnimated: boolean;

	/**
	 * The set of nodes whose output affects the computed value of the property.
	 */
	affectedByNodesInGraph: Set<string>;
}

interface PropertyInfoRegistry {
	layerIdSet: Set<string>;
	properties: { [propertyId: string]: PropertyInfo };
	propertyIdsByLayer: { [layerId: string]: string[] };
	addLayer: (actionState: ActionState, layerId: string) => void;
	getAnimatedPropertyIds: () => string[];
}

export const createPropertyInfoRegistry = (
	actionState: ActionState,
	compositionId: string,
): PropertyInfoRegistry => {
	const registry: PropertyInfoRegistry = {
		layerIdSet: new Set(),
		properties: {},
		propertyIdsByLayer: {},
		addLayer: (actionState, layerId) =>
			addLayerToPropertyInfoRegistry(registry, actionState, layerId),
		getAnimatedPropertyIds: () => getAnimatedPropertyIds(registry),
	};

	const { compositionState } = actionState;
	const composition = compositionState.compositions[compositionId];
	for (const layerId of composition.layers) {
		registry.addLayer(actionState, layerId);
	}

	return registry;
};

const addLayerToPropertyInfoRegistry = (
	registry: PropertyInfoRegistry,
	actionState: ActionState,
	layerId: string,
) => {
	registry.layerIdSet.add(layerId);

	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];

	const propertyMap = registry.properties;
	const registered: string[] = [];
	registry.propertyIdsByLayer[layerId] = registered;

	const touched = new Set<string>();

	const add = (propertyId: string, performable: Performable) => {
		if (touched.has(propertyId)) {
			console.warn(`Property '${propertyId}' already registered.`);
			return;
		}
		touched.add(propertyId);

		registered.push(propertyId);
		const property = compositionState.properties[propertyId] as Property;
		const isAnimated = !!property.timelineId;
		propertyMap[propertyId] = {
			performable,
			isAnimated,
			affectedByNodesInGraph: EMPTY_STR_SET,
		};
	};

	const transformGroupIndex = layer.properties.findIndex((propertyId) => {
		const property = compositionState.properties[propertyId];
		return property.name === PropertyGroupName.Transform;
	});
	const modifiersGroupIndex = layer.properties.findIndex((propertyId) => {
		const property = compositionState.properties[propertyId];
		return property.name === PropertyGroupName.Modifiers;
	});

	const modifiersGroup = compositionState.properties[
		layer.properties[modifiersGroupIndex]
	] as PropertyGroup;
	for (const propertyId of modifiersGroup.properties) {
		const modifierGroup = compositionState.properties[propertyId] as PropertyGroup;

		if (modifierGroup.name !== PropertyGroupName.ArrayModifier) {
			throw new Error(`Unexpected property group name '${modifierGroup.name}'.`);
		}

		// Find transform group within array modifier
		const arrayModifierTransformGroupIndex = modifierGroup.properties.findIndex(
			(propertyId) => {
				const property = compositionState.properties[propertyId];
				return property.name === PropertyGroupName.Transform;
			},
		);
		forEachSubProperty(
			modifierGroup.properties[arrayModifierTransformGroupIndex],
			compositionState,
			(property) => {
				add(property.id, Performable.UpdateArrayModifierTransform);
			},
		);
		for (let i = 0; i < modifierGroup.properties.length; i++) {
			if (i === arrayModifierTransformGroupIndex) {
				continue;
			}
			const property = compositionState.properties[modifierGroup.properties[i]];

			if (property.name === CompoundPropertyName.ArrayModifier_Origin) {
				forEachSubProperty(property.id, compositionState, (property) => {
					add(property.id, Performable.UpdateArrayModifierTransform);
				});
				continue;
			}

			if (property.type !== "property") {
				throw new Error(`Expected property of type 'property'. Got '${property.type}'.`);
			}

			if (property.name === PropertyName.ArrayModifier_Count) {
				add(property.id, Performable.UpdateArrayModifierCount);
			} else {
				add(property.id, Performable.UpdateArrayModifierTransform);
			}
		}
	}

	forEachSubProperty(layer.properties[transformGroupIndex], compositionState, (property) => {
		if (property.name === PropertyName.PositionX || property.name === PropertyName.PositionY) {
			add(property.id, Performable.UpdatePosition);
			return;
		}
		add(property.id, Performable.UpdateTransform);
	});
	for (let i = 0; i < layer.properties.length; i++) {
		if (i === transformGroupIndex) {
			continue;
		}
		if (i === modifiersGroupIndex) {
			continue;
		}
		forEachSubProperty(layer.properties[i], compositionState, (property) => {
			add(property.id, Performable.DrawLayer);
		});
	}
};

const getAnimatedPropertyIds = (registry: PropertyInfoRegistry) => {
	const propertyIds: string[] = [];
	const layerIds = [...registry.layerIdSet];
	for (const layerId of layerIds) {
		for (const propertyId of registry.propertyIdsByLayer[layerId]) {
			if (registry.properties[propertyId].isAnimated) {
				propertyIds.push(propertyId);
			}
		}
	}
	return propertyIds;
};
