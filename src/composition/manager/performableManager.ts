import { Property, PropertyGroup } from "~/composition/compositionTypes";
import { forEachSubProperty } from "~/composition/compositionUtils";
import { PropertyManager } from "~/composition/manager/propertyManager";
import { CompoundPropertyName, PropertyGroupName, PropertyName } from "~/types";

const EMPTY_STR_SET = new Set<string>();

export enum Performable {
	DrawLayer,
	UpdatePosition,
	UpdateTransform,
	UpdateArrayModifierTransform,
	UpdateArrayModifierCount,
}

type LayerPerformables = { layerId: string; performables: Performable[] };

export interface PerformableManager {
	addLayer: (actionState: ActionState, layerId: string) => void;
	onUpdateLayerStructure: (actionState: ActionState, layerId: string) => void;
	removeLayer: (layerId: string) => void;
	getAnimatedPropertyIds: () => string[];
	getActionsToPerform: (actionState: ActionState, propertyIds: string[]) => LayerPerformables[];
	getActionsToPerformOnFrameIndexChange: () => Array<LayerPerformables>;
}

interface PropertyInformation {
	performable: Performable;
	isAnimated: boolean;
	affectedByNodesInGraph: Set<string>;
}

export const createPerformableManager = (propertyManager: PropertyManager): PerformableManager => {
	const propertyMap: Record<string, PropertyInformation> = {};
	const propertyIdsByLayer: Record<string, string[]> = {};
	const layerIdSet = new Set<string>();

	const self: PerformableManager = {
		addLayer: (actionState, layerId) => {
			const { compositionState } = actionState;
			const layer = compositionState.layers[layerId];

			const registered: string[] = [];
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
						throw new Error(
							`Expected property of type 'property'. Got '${property.type}'.`,
						);
					}

					if (property.name === PropertyName.ArrayModifier_Count) {
						add(property.id, Performable.UpdateArrayModifierCount);
					} else {
						add(property.id, Performable.UpdateArrayModifierTransform);
					}
				}
			}

			forEachSubProperty(
				layer.properties[transformGroupIndex],
				compositionState,
				(property) => {
					if (
						property.name === PropertyName.PositionX ||
						property.name === PropertyName.PositionY
					) {
						add(property.id, Performable.UpdatePosition);
						return;
					}
					add(property.id, Performable.UpdateTransform);
				},
			);
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
			propertyIdsByLayer[layerId] = registered;
			layerIdSet.add(layerId);
		},

		onUpdateLayerStructure: (...args) => self.addLayer(...args),

		removeLayer: (layerId) => {
			const registered = propertyIdsByLayer[layerId];
			delete propertyIdsByLayer[layerId];
			for (const propertyId of registered) {
				delete propertyMap[propertyId];
			}
			layerIdSet.delete(layerId);
		},

		getActionsToPerform: (actionState, propertyIds) => {
			const { compositionState } = actionState;
			const performablesByLayer: Record<string, Set<Performable>> = {};

			for (const propertyId of propertyIds) {
				const property = compositionState.properties[propertyId];

				if (!performablesByLayer[property.layerId]) {
					performablesByLayer[property.layerId] = new Set();
				}

				performablesByLayer[property.layerId].add(propertyMap[propertyId].performable);
			}

			const layerIds = Object.keys(performablesByLayer);
			for (const layerId of layerIds) {
				const performableSet = performablesByLayer[layerId];
				if (performableSet.has(Performable.UpdateTransform)) {
					performableSet.delete(Performable.UpdatePosition);
				}
			}

			return layerIds.map((layerId) => ({
				layerId,
				performables: [...performablesByLayer[layerId]],
			}));
		},

		getAnimatedPropertyIds: () => {
			const propertyIds: string[] = [];

			const layerIds = [...layerIdSet];
			for (const layerId of layerIds) {
				for (const propertyId of propertyIdsByLayer[layerId]) {
					if (propertyMap[propertyId].isAnimated) {
						propertyIds.push(propertyId);
					}
				}
			}

			return propertyIds;
		},

		getActionsToPerformOnFrameIndexChange: () => {
			const layerIds = [...layerIdSet];

			const graph_pidsAffectedByFrameInGraphByLayer = propertyManager.getPropertyIdsAffectedByFrameIndexInGraphByLayer();

			const layerPerformables: LayerPerformables[] = [];
			for (const layerId of layerIds) {
				const allLayerPropertyIds = propertyIdsByLayer[layerId];
				const performableSet = new Set<Performable>();

				for (const propertyId of allLayerPropertyIds) {
					const info = propertyMap[propertyId];
					if (info.isAnimated) {
						performableSet.add(info.performable);
					}
				}

				for (const propertyId of graph_pidsAffectedByFrameInGraphByLayer[layerId] || []) {
					const info = propertyMap[propertyId];
					performableSet.add(info.performable);
				}

				if (performableSet.has(Performable.UpdateTransform)) {
					performableSet.delete(Performable.UpdatePosition);
				}

				if (performableSet.size === 0) {
					continue;
				}

				const performables = [...performableSet];
				layerPerformables.push({ layerId, performables });
			}

			return layerPerformables;
		},
	};
	return self;
};
