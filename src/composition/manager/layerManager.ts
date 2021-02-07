import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { manageComposition } from "~/composition/manager/compositionManager";
import { GraphicManager } from "~/composition/manager/graphicManager";
import {
	createPerformableManager,
	PerformableManager,
} from "~/composition/manager/performableManager";
import { populateLayerManager } from "~/composition/manager/populateLayerManager";
import { PropertyManager } from "~/composition/manager/propertyManager";
import { getTransformFromTransformGroupId } from "~/composition/transformUtils";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import { DEFAULT_LAYER_TRANSFORM } from "~/constants";
import { adjustDiffsToChildComposition } from "~/diff/adjustDiffsToChildComposition";
import { Diff } from "~/diff/diffs";
import { applyPixiLayerTransform } from "~/render/pixi/pixiLayerTransform";
import { createArrayModifierPIXITransforms } from "~/render/pixi/pixiTransform";
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
	graphicManager: GraphicManager,
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

	// const addContentToOwnContentContainer = (layer: Layer) => {
	// 	const { ownContentContainer } = layerContainers[layer.id];

	// 	if (layer.type === LayerType.Composition) {
	// 		ownContentContainer.addChild(container);
	// 		return;
	// 	}

	// 	for (let i = 0; i < 3; i++) {
	// 		const child = new PIXI.Graphics(graphic.geometry);
	// 		child.position.x = i * 10;
	// 		ownContentContainer.addChild(child);
	// 	}
	// };

	const self: LayerManager = {
		addLayer: (layer, actionState) => {
			if (layerContainers[layer.id]) {
				// Layer is already present.
				//
				// Warn about this happening and remove the layer before re-adding.
				console.warn(`Added already present layer '${layer.id}'.`);
				self.removeLayer(layer);
			}

			const transformContainer = new PIXI.Container();
			const ownContentContainer = new PIXI.Container();
			const childLayerContainer = new PIXI.Container();

			layerContainers[layer.id] = {
				transformContainer,
				ownContentContainer,
				childLayerContainer,
			};

			// The layer's transform affects both its own content and the content
			// of its child layers, so we add both to the transform container.
			transformContainer.addChild(ownContentContainer);
			transformContainer.addChild(childLayerContainer);

			if (layer.type !== LayerType.Composition) {
				// Create the root graphic of the layer
				graphicManager.getLayerGraphic(actionState, layer);
			}

			const { getPropertyValue } = properties;
			const map = constructLayerPropertyMap(layer.id, actionState.compositionState);

			applyPixiLayerTransform({ transformContainer, getPropertyValue, layer, map });

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

			const { compositionState } = actionState;
			const arrayModifiers = getLayerArrayModifiers(layer.id, compositionState);

			const resolvedModifiers =
				arrayModifiers.length === 0
					? [
							{
								count: 1,
								transform: DEFAULT_LAYER_TRANSFORM,
							},
					  ]
					: arrayModifiers.map((modifier) => {
							const transform = getTransformFromTransformGroupId(
								modifier.transformGroupId,
								compositionState,
								properties.getPropertyValue,
							);
							return {
								count: getPropertyValue(modifier.countId),
								transform,
							};
					  });

			const dimensions = resolvedModifiers.map((item) => item.count);
			const transforms = resolvedModifiers.map((item) => item.transform);

			const pixiTransforms = createArrayModifierPIXITransforms(dimensions, transforms);

			for (let i = 0; i < pixiTransforms.length; i++) {
				const graphic = graphicManager.getLayerGraphic(actionState, layer);
				const g0 = new PIXI.Graphics(graphic.geometry);
				g0.localTransform.append(pixiTransforms[i].worldTransform);
				ownContentContainer.addChild(g0);
			}
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

			graphicManager.deleteLayerGraphic(layer.id);

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
			console.log("update property structe");
			performableManager.onUpdateLayerStructure(actionState, layer.id);
			properties.updateStructure(actionState);
			self.addLayer(layer, actionState);
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
