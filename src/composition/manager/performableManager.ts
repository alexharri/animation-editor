import { Property } from "~/composition/compositionTypes";
import { forEachSubProperty } from "~/composition/compositionUtils";
import { PropertyGroupName, PropertyName } from "~/types";

const EMPTY_STR_SET = new Set<string>();

export enum Performable {
	DrawLayer,
	UpdatePosition,
	UpdateTransform,
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

export const createPerformableManager = (): PerformableManager => {
	const propertyMap: Record<string, PropertyInformation> = {};
	const registeredPropertyIdsByLayer: Record<string, string[]> = {};
	const layerIdSet = new Set<string>();
	// const layerToPropertiesAffectedByGraph: Record<string, string[]>;
	// const layerToPropertiesAffectedByFrameIndexChange: Record<string, string[]>;

	const self: PerformableManager = {
		addLayer: (actionState, layerId) => {
			const { compositionState } = actionState;
			const layer = compositionState.layers[layerId];

			const registered: string[] = [];
			const add = (propertyId: string, performable: Performable) => {
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
			for (let i = 0; i < forEachSubProperty.length; i++) {
				if (i === transformGroupIndex) {
					continue;
				}
				forEachSubProperty(layer.properties[i], compositionState, (property) => {
					add(property.id, Performable.DrawLayer);
				});
			}
			registeredPropertyIdsByLayer[layerId] = registered;
			layerIdSet.add(layerId);
		},

		onUpdateLayerStructure: (...args) => self.addLayer(...args),

		removeLayer: (layerId) => {
			const registered = registeredPropertyIdsByLayer[layerId];
			delete registeredPropertyIdsByLayer[layerId];
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
				for (const propertyId of registeredPropertyIdsByLayer[layerId]) {
					if (propertyMap[propertyId].isAnimated) {
						propertyIds.push(propertyId);
					}
				}
			}

			return propertyIds;
		},

		getActionsToPerformOnFrameIndexChange: () => {
			const layerIds = [...layerIdSet];

			const layerPerformables: LayerPerformables[] = [];
			for (const layerId of layerIds) {
				const registered = registeredPropertyIdsByLayer[layerId];
				const performableSet = new Set<Performable>();

				for (const propertyId of registered) {
					const info = propertyMap[propertyId];
					if (info.isAnimated) {
						performableSet.add(info.performable);
					}
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
