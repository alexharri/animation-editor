import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import { createLayerViewportMatrices } from "~/composition/layer/constructLayerMatrix";
import { getLayerRect } from "~/composition/layer/layerDimensions";
import {
	createLayerInstances,
	drawGuides,
	drawHitTestGraphic,
} from "~/composition/layer/layerInstances";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { manageComposition } from "~/composition/manager/compositionManager";
import { GraphicManager } from "~/composition/manager/graphicManager";
import {
	InteractionManager,
	_emptyInteractionManager,
} from "~/composition/manager/interactionManager";
import { populateLayerManager } from "~/composition/manager/populateLayerManager";
import { PropertyManager } from "~/composition/manager/property/propertyManager";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { adjustDiffsToChildComposition } from "~/diff/adjustDiffsToChildComposition";
import { Diff } from "~/diff/diffs";
import { applyPixiLayerTransform } from "~/render/pixi/pixiLayerTransform";
import { getLayerChildLayers } from "~/shared/layer/layerParentSort";
import { getActionState } from "~/state/stateUtils";
import { LayerType } from "~/types";

export interface LayerPixiContainers {
	transformContainer: PIXI.Container;
	childLayerContainer: PIXI.Container;
	ownContentContainer: PIXI.Container;
	guideAnchor: PIXI.Container;
	rectCorners: PIXI.Graphics;
	hitTestGraphic: PIXI.Graphics;
	rectLines: PIXI.Graphics;
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
	updateLayerGuides: (actionState: ActionState, layerId: string) => void;
	updateOwnAndChildLayerGuides: (actionState: ActionState, layerId: string) => void;
	onScaleChange: (actionState: ActionState, scale: number) => void;
	onSelectionChange: (actionState: ActionState) => void;
	getLayerAtPoint: (point: Vec2) => string | undefined;
}

export const createLayerManager = (
	compositionId: string,
	compositionContainer: PIXI.Container,
	interactions: InteractionManager,
	properties: PropertyManager,
	graphicManager: GraphicManager,
	actionState: ActionState,
	initialScale = 1,
): LayerManager => {
	const layerContainers: Record<string, LayerPixiContainers> = {};
	const layerToVisible: Record<string, boolean> = {};
	const layerToSelected: Record<string, boolean> = {};
	const subCompositions: Record<
		string,
		{ layerId: string; manager: ReturnType<typeof manageComposition> }
	> = {};
	const layerPropertyMapMap: Record<string, LayerPropertyMap> = {};

	let scale = initialScale;

	const onLayerSelectionChange = (actionState: ActionState, layerId: string) => {
		const { compositionSelectionState } = actionState;
		const selection = compSelectionFromState(compositionId, compositionSelectionState);

		// const containers = layerContainers[layerId];
		// const { rectCorners, rectLines, guideAnchor } = containers;

		const selected = !!selection.layers[layerId];
		layerToSelected[layerId] = selected;

		// rectCorners.alpha = selected ? 1 : 0;
		// rectLines.alpha = selected ? 1 : 0;
		// guideAnchor.alpha = selected ? 1 : 0;
	};

	const self: LayerManager = {
		addLayer: (layer, actionState) => {
			if (layerContainers[layer.id]) {
				// Layer is already present.
				//
				// Warn about this happening and remove the layer before re-adding.
				console.warn(`Added already present layer '${layer.id}'.`);
				self.removeLayer(layer, actionState);
			}

			const transformContainer = new PIXI.Container();
			const ownContentContainer = new PIXI.Container();
			const childLayerContainer = new PIXI.Container();
			const guideAnchor = new PIXI.Container();
			const rectLines = new PIXI.Graphics();
			const hitTestGraphic = new PIXI.Graphics();
			const rectCorners = new PIXI.Graphics();

			layerContainers[layer.id] = {
				transformContainer,
				ownContentContainer,
				childLayerContainer,
				guideAnchor,
				rectCorners,
				hitTestGraphic,
				rectLines,
			};

			// The layer's transform affects both its own content and the content
			// of its child layers, so we add both to the transform container.
			transformContainer.addChild(ownContentContainer);
			transformContainer.addChild(childLayerContainer);
			transformContainer.addChild(hitTestGraphic);
			// transformContainer.addChild(rectLines);
			// transformContainer.addChild(rectCorners);
			// transformContainer.addChild(guideAnchor);

			const compositionSelection = compSelectionFromState(
				compositionId,
				actionState.compositionSelectionState,
			);

			const layerSelected = !!compositionSelection.layers[layer.id];
			layerToSelected[layer.id] = layerSelected;

			hitTestGraphic.interactive = true;
			hitTestGraphic.alpha = 0;
			hitTestGraphic.on("mouseover", () => {
				interactions.layerMouseOver(layer.id);
			});
			hitTestGraphic.on("mouseout", () => {
				interactions.layerMouseOut(layer.id);
			});
			hitTestGraphic.on("mousedown", () => {
				interactions.layerMouseDown(layer.id);
			});

			if (layer.type !== LayerType.Composition) {
				graphicManager.getLayerGraphic(actionState, layer);
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
				const manager = manageComposition(
					compositionId,
					_emptyInteractionManager,
					ownContentContainer,
				);
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

			drawGuides(
				actionState,
				layer,
				layerPropertyMapMap[layer.id],
				properties.getPropertyValue,
				layerContainers[layer.id],
				scale,
			);
			drawHitTestGraphic(actionState, layer, hitTestGraphic, properties.getPropertyValue);
			onLayerSelectionChange(actionState, layer.id);

			const matrices = createLayerViewportMatrices(
				actionState,
				self,
				properties,
				layer.id,
				scale,
			);
			const rect = getLayerRect(
				actionState,
				layer,
				self.getLayerPropertyMap(layer.id),
				properties.getPropertyValue,
			);
			interactions.addLayer(actionState, layer.id, matrices, rect);
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

			interactions.removeLayer(layer.id);
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
				const containers = layerContainers[layerId];
				const { hitTestGraphic } = containers;
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

		onSelectionChange: (actionState) => {
			const { compositionState } = actionState;
			const composition = compositionState.compositions[compositionId];

			for (const layerId of composition.layers) {
				onLayerSelectionChange(actionState, layerId);
				self.updateLayerGuides(actionState, layerId);
			}
		},

		updateLayerGuides: (actionState, layerId) => {
			const { compositionState } = actionState;
			drawHitTestGraphic(
				actionState,
				compositionState.layers[layerId],
				layerContainers[layerId].hitTestGraphic,
				properties.getPropertyValue,
			);
			drawGuides(
				actionState,
				compositionState.layers[layerId],
				layerPropertyMapMap[layerId],
				properties.getPropertyValue,
				layerContainers[layerId],
				scale,
			);

			const matrices = createLayerViewportMatrices(
				actionState,
				self,
				properties,
				layerId,
				scale,
			);

			const rect = getLayerRect(
				actionState,
				compositionState.layers[layerId],
				layerPropertyMapMap[layerId],
				properties.getPropertyValue,
			);
			interactions.update(actionState, layerId, matrices, rect);
		},

		updateOwnAndChildLayerGuides: (actionState, layerId) => {
			const { compositionState } = actionState;
			self.updateLayerGuides(actionState, layerId);

			const childLayers = getLayerChildLayers(layerId, compositionState);
			for (const layerId of childLayers) {
				self.updateLayerGuides(actionState, layerId);
			}
		},

		onScaleChange: (actionState, nextScale) => {
			if (scale === nextScale) {
				return;
			}
			scale = nextScale;
			const { compositionState } = actionState;
			const composition = compositionState.compositions[compositionId];
			for (const layerId of composition.layers) {
				self.updateLayerGuides(actionState, layerId);
			}
		},
	};

	populateLayerManager(compositionId, self, actionState);

	return self;
};
