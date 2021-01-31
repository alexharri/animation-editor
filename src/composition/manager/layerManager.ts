import { Layer } from "~/composition/compositionTypes";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { manageComposition } from "~/composition/manager/compositionManager";
import {
	createPerformableManager,
	PerformableManager,
} from "~/composition/manager/performableManager";
import { populateLayerManager } from "~/composition/manager/populateLayerManager";
import { PropertyManager } from "~/composition/manager/propertyManager";
import { adjustDiffsToChildComposition } from "~/diff/adjustDiffsToChildComposition";
import { Diff } from "~/diff/diffs";
import { layerToPixi } from "~/render/pixi/layerToPixi";
import { LayerType, TRANSFORM_PROPERTY_NAMES } from "~/types";

export interface LayerManager {
	addLayer: (layer: Layer, actionState: ActionState) => void;
	onUpdateLayerParent: (layerId: string, actionState: ActionState) => void;
	updatePropertyStructure: (layer: Layer, actionState: ActionState) => void;
	removeLayer: (layer: Layer) => void;
	getLayerTransformContainer: (layerId: string) => PIXI.Container;
	getLayerOwnContentContainer: (layerId: string) => PIXI.Container;
	getLayerChildLayerContainer: (layerId: string) => PIXI.Container;
	sendDiffs: (actionState: ActionState, diffs: Diff[], direction: "forward" | "backward") => void;
	getAnimatedPropertyIds: PerformableManager["getAnimatedPropertyIds"];
	getActionsToPerform: PerformableManager["getActionsToPerform"];
	getActionsToPerformOnFrameIndexChange: PerformableManager["getActionsToPerformOnFrameIndexChange"];
	getLayerPropertyMap: (layerId: string) => LayerPropertyMap;
	onFrameIndexChanged: (actionState: ActionState, frameIndex: number) => void;
}

export const createLayerManager = (
	compositionId: string,
	compositionContainer: PIXI.Container,
	properties: PropertyManager,
	actionState: ActionState,
): LayerManager => {
	const layerContainers: Record<
		string,
		{
			transformContainer: PIXI.Container;
			childLayerContainer: PIXI.Container;
			ownContentContainer: PIXI.Container;
		}
	> = {};
	const layerToVisible: Record<string, boolean> = {};
	const subCompositions: Record<
		string,
		{ layerId: string; manager: ReturnType<typeof manageComposition> }
	> = {};
	const performableManager = createPerformableManager(properties);
	const layerPropertyMapMap: Record<string, LayerPropertyMap> = {};

	const self: LayerManager = {
		addLayer: (layer, actionState) => {
			if (layerContainers[layer.id]) {
				// Layer is already present.
				//
				// Warn about this happening and remove the layer before re-adding.
				console.warn(`Added already present layer '${layer.id}'.`);
				self.removeLayer(layer);
			}

			// Create PIXI container and add to registry
			layerContainers[layer.id] = layerToPixi(
				actionState,
				layer,
				properties.getPropertyValue,
			);
			const { transformContainer, ownContentContainer } = layerContainers[layer.id];

			let parentContainer = compositionContainer;

			if (layer.parentLayerId) {
				parentContainer = self.getLayerChildLayerContainer(layer.parentLayerId);
			}

			// Add the layer to the parent container
			parentContainer.addChild(transformContainer);

			if (layer.type === LayerType.Composition) {
				// The layer is a composition layer.
				//
				// We don't render the composition directly. Instead we create a
				// sub-composition manager which takes care of keeping the content
				// of the layer container up to date.
				const { compositionState } = actionState;
				const compositionId = compositionState.compositionLayerIdToComposition[layer.id];
				const manager = manageComposition(compositionId, ownContentContainer);
				subCompositions[layer.id] = { manager, layerId: layer.id };
			}

			performableManager.addLayer(actionState, layer.id);
			layerPropertyMapMap[layer.id] = constructLayerPropertyMap(
				layer.id,
				actionState.compositionState,
			);
			layerToVisible[layer.id] = true;
		},

		onUpdateLayerParent: (layerId, actionState) => {
			const layer = actionState.compositionState.layers[layerId];

			if (layer.compositionId !== compositionId) {
				// Layer is not in composition. No work to be done.
				return;
			}

			const layerContainer = self.getLayerTransformContainer(layer.id);
			layerContainer.parent.removeChild(layerContainer);

			const parentContainer = layer.parentLayerId
				? self.getLayerChildLayerContainer(layer.parentLayerId)
				: compositionContainer;
			parentContainer.addChild(layerContainer);

			// Update transform
			const map = layerPropertyMapMap[layerId];
			const transformPropertyIds = TRANSFORM_PROPERTY_NAMES.map((name) => map[name]);
			properties.onPropertyIdsChanged(transformPropertyIds, actionState);
		},

		removeLayer: (layer) => {
			// Destroy the PIXI container
			const { transformContainer } = layerContainers[layer.id];
			transformContainer.parent.removeChild(transformContainer);
			transformContainer.destroy({ children: true }); // Also destroys ownContent

			// Remove the container from the registry
			delete layerContainers[layer.id];
			delete layerPropertyMapMap[layer.id];
			delete layerToVisible[layer.id];

			if (layer.type === LayerType.Composition) {
				// The layer is a composition layer.
				//
				// Remove the sub-composition manager.
				const { manager } = subCompositions[layer.id];
				manager.destroy();
			}

			performableManager.removeLayer(layer.id);
		},

		getLayerTransformContainer: (layerId) => {
			return layerContainers[layerId].transformContainer;
		},
		getLayerOwnContentContainer: (layerId) => {
			return layerContainers[layerId].ownContentContainer;
		},
		getLayerChildLayerContainer: (layerId) => {
			return layerContainers[layerId].childLayerContainer;
		},

		// Send some diffs to the sub-composition managers.
		//
		// Those composition managers will send the diffs to their sub-composition
		// managers and so on.
		sendDiffs: (actionState, _diffs, direction) => {
			const keys = Object.keys(subCompositions);
			for (const key of keys) {
				const { manager, layerId } = subCompositions[key];

				const diffs = adjustDiffsToChildComposition(actionState, _diffs, layerId);

				manager.onDiffs(actionState, diffs, direction);
			}
		},

		onFrameIndexChanged: (actionState, frameIndex) => {
			const { compositionState } = actionState;
			const composition = compositionState.compositions[compositionId];

			for (const layerId of composition.layers) {
				const { index, length } = compositionState.layers[layerId];
				const visible = index <= frameIndex && index + length >= frameIndex;
				const lastVisible = layerToVisible[layerId];

				if (visible !== lastVisible) {
					const container = layerContainers[layerId].ownContentContainer;
					container.visible = visible;
					layerToVisible[layerId] = visible;
				}
			}
		},

		updatePropertyStructure: (layer, actionState) => {
			performableManager.onUpdateLayerStructure(actionState, layer.id);
		},

		getLayerPropertyMap: (layerId) => layerPropertyMapMap[layerId],

		getAnimatedPropertyIds: performableManager.getAnimatedPropertyIds,

		getActionsToPerform: performableManager.getActionsToPerform,

		getActionsToPerformOnFrameIndexChange:
			performableManager.getActionsToPerformOnFrameIndexChange,
	};

	populateLayerManager(compositionId, self, actionState);

	return self;
};
