import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import { createLayerInstances } from "~/composition/layer/layerInstances";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { manageComposition } from "~/composition/manager/compositionManager";
import { GraphicManager } from "~/composition/manager/graphicManager";
import { HitTestManager } from "~/composition/manager/hitTest/HitTestManager";
import { populateLayerManager } from "~/composition/manager/populateLayerManager";
import { PropertyManager } from "~/composition/manager/property/propertyManager";
import { adjustDiffsToChildComposition } from "~/diff/adjustDiffsToChildComposition";
import { Diff } from "~/diff/diffs";
import { applyPixiLayerTransform } from "~/render/pixi/pixiLayerTransform";
import { getActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";

export interface LayerPixiContainers {
	transformContainer: PIXI.Container;
	childLayerContainer: PIXI.Container;
	ownContentContainer: PIXI.Container;
}

export interface LayerManager {
	addLayer: (layer: Layer, actionState: ActionState) => void;
	onUpdateLayerParent: (layerId: string, actionState: ActionState) => void;
	updatePropertyStructure: (layer: Layer, actionState: ActionState) => void;
	removeLayer: (layer: Layer, actionState: ActionState) => void;
	getLayerTransformContainer: (layerId: string) => PIXI.Container;
	getLayerOwnContentContainer: (layerId: string) => PIXI.Container;
	getLayerChildLayerContainer: (layerId: string) => PIXI.Container;
	sendDiffs: (actionState: ActionState, diffs: Diff[], direction: "forward" | "backward") => void;
	getLayerPropertyMap: (layerId: string) => LayerPropertyMap;
	onFrameIndexChanged: (actionState: ActionState, frameIndex: number) => void;
	getLayerAtPoint: (point: Vec2) => string | undefined;
}

export const createLayerManager = (
	compositionId: string,
	compositionContainer: PIXI.Container,
	properties: PropertyManager,
	graphicManager: GraphicManager,
	hitTestManager: HitTestManager,
	actionState: ActionState,
): LayerManager => {
	const layerContainers: Record<string, LayerPixiContainers> = {};
	const layerToVisible: Record<string, boolean> = {};
	const subCompositions: Record<
		string,
		{ layerId: string; manager: ReturnType<typeof manageComposition> }
	> = {};
	const layerPropertyMapMap: Record<string, LayerPropertyMap> = {};

	const self: LayerManager = {
		addLayer: (layer, actionState) => {
			if (layerContainers[layer.id]) {
				// Layer is already present.
				//
				// Warn about this happening.
				console.warn(`Added already present layer '${layer.id}'.`);
				return;
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
				graphicManager.getLayerGraphic(actionState, layer);

				const hitTestGraphic = hitTestManager.getGraphic(actionState, layer.id);
				transformContainer.addChild(hitTestGraphic);
			}

			const { getPropertyValue: getPropertyValue } = properties;
			const map = constructLayerPropertyMap(layer.id, actionState.compositionState);

			applyPixiLayerTransform(transformContainer, map, getPropertyValue);

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
				const parentCompContainer = ownContentContainer;
				const manager = manageComposition({ parentCompContainer, compositionId });
				subCompositions[layer.id] = { manager, layerId: layer.id };
			}

			layerPropertyMapMap[layer.id] = constructLayerPropertyMap(
				layer.id,
				actionState.compositionState,
			);
			layerToVisible[layer.id] = true;

			if (layer.type !== LayerType.Composition) {
				createLayerInstances(
					actionState,
					layer,
					layerPropertyMapMap[layer.id],
					properties.getPropertyValue,
					ownContentContainer,
					graphicManager.getLayerGraphic(actionState, layer),
				);
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
		},

		removeLayer: (layer) => {
			// Destroy the PIXI container
			const { transformContainer } = layerContainers[layer.id];
			transformContainer.parent.removeChild(transformContainer);
			transformContainer.destroy({ children: true }); // Also destroys ownContent

			graphicManager.deleteLayerGraphic(layer.id);
			hitTestManager.deleteGraphic(layer.id);

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

		getLayerAtPoint: (point: Vec2): string | undefined => {
			const { compositionState } = getActionState();
			const composition = compositionState.compositions[compositionId];

			for (const layerId of composition.layers) {
				const hitTestGraphic = hitTestManager.getGraphic(actionState, layerId);
				if (hitTestGraphic.containsPoint(point)) {
					return layerId;
				}
			}

			return undefined;
		},

		updatePropertyStructure: (layer, actionState) => {
			self.addLayer(layer, actionState);
		},

		getLayerPropertyMap: (layerId) => layerPropertyMapMap[layerId],
	};

	populateLayerManager(compositionId, self, actionState);

	return self;
};
