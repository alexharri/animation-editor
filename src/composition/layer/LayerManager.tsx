import * as PIXI from "pixi.js";
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
import { LayerType } from "~/types";

export interface LayerPixiContainers {
	transformContainer: PIXI.Container;
	childLayerContainer: PIXI.Container;
	ownContentContainer: PIXI.Container;
}

type Subcomposition = { layerId: string; manager: ReturnType<typeof manageComposition> };

interface Options {
	compositionId: string;
	compositionContainer: PIXI.Container;
	propertyManager: PropertyManager;
	graphicManager: GraphicManager;
	hitTestManager: HitTestManager;
	actionState: ActionState;
}

export class LayerManager {
	public compositionId: string;

	private options: Options;
	private graphicManager: GraphicManager;
	private hitTestManager: HitTestManager;
	private propertyManager: PropertyManager;
	private layerContainers: Record<string, LayerPixiContainers> = {};
	private layerToVisible: Record<string, boolean> = {};
	private subCompositions: Record<string, Subcomposition> = {};
	private layerPropertyMapMap: Record<string, LayerPropertyMap> = {};

	constructor(options: Options) {
		this.options = options;
		this.compositionId = this.options.compositionId;
		this.graphicManager = this.options.graphicManager;
		this.hitTestManager = this.options.hitTestManager;
		this.propertyManager = this.options.propertyManager;

		populateLayerManager(this.options.actionState, this);
	}

	public addLayer(actionState: ActionState, layerId: string) {
		if (this.layerContainers[layerId]) {
			// Layer is already present.
			//
			// Warn about this happening.
			console.warn(`Added already present layer '${layerId}'.`);
			return;
		}

		const { compositionState } = actionState;
		const layer = compositionState.layers[layerId];

		const transformContainer = new PIXI.Container();
		const ownContentContainer = new PIXI.Container();
		const childLayerContainer = new PIXI.Container();

		this.layerContainers[layerId] = {
			transformContainer,
			ownContentContainer,
			childLayerContainer,
		};

		// The layer's transform affects both its own content and the content
		// of its child layers, so we add both to the transform container.
		transformContainer.addChild(ownContentContainer);
		transformContainer.addChild(childLayerContainer);

		if (layer.type !== LayerType.Composition) {
			this.graphicManager.getLayerGraphic(actionState, layer);

			const hitTestGraphic = this.hitTestManager.getGraphic(actionState, layerId);
			transformContainer.addChild(hitTestGraphic);
		}

		const { getPropertyValue } = this.propertyManager;
		const map = constructLayerPropertyMap(layerId, actionState.compositionState);

		applyPixiLayerTransform(transformContainer, map, getPropertyValue);

		let parentContainer = this.options.compositionContainer;
		if (layer.parentLayerId) {
			parentContainer = this.getLayerChildLayerContainer(layer.parentLayerId);
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
			const compositionId = compositionState.compositionLayerIdToComposition[layerId];
			const parentCompContainer = ownContentContainer;
			const manager = manageComposition({ parentCompContainer, compositionId });
			this.subCompositions[layerId] = { manager, layerId: layerId };
		}

		this.layerPropertyMapMap[layerId] = constructLayerPropertyMap(
			layerId,
			actionState.compositionState,
		);
		this.layerToVisible[layerId] = true;

		if (layer.type !== LayerType.Composition) {
			createLayerInstances(
				actionState,
				layer,
				this.layerPropertyMapMap[layerId],
				getPropertyValue,
				ownContentContainer,
				this.graphicManager.getLayerGraphic(actionState, layer),
			);
		}
	}

	public onUpdateLayerParent(actionState: ActionState, layerId: string) {
		const layer = actionState.compositionState.layers[layerId];

		if (layer.compositionId !== this.compositionId) {
			// Layer is not in composition. No work to be done.
			return;
		}

		const layerContainer = this.getLayerTransformContainer(layer.id);
		layerContainer.parent.removeChild(layerContainer);

		const parentContainer = layer.parentLayerId
			? this.getLayerChildLayerContainer(layer.parentLayerId)
			: this.options.compositionContainer;
		parentContainer.addChild(layerContainer);
	}

	public removeLayer(layerId: string) {
		// Destroy the PIXI container
		const { transformContainer } = this.layerContainers[layerId];
		transformContainer.parent.removeChild(transformContainer);
		transformContainer.destroy({ children: true }); // Also destroys ownContent

		this.graphicManager.deleteLayerGraphic(layerId);
		this.hitTestManager.deleteGraphic(layerId);

		// Remove the container from the registry
		delete this.layerContainers[layerId];
		delete this.layerPropertyMapMap[layerId];
		delete this.layerToVisible[layerId];

		if (this.subCompositions[layerId]) {
			// The layer is a composition layer.
			//
			// Remove the sub-composition manager.
			const { manager } = this.subCompositions[layerId];
			manager.destroy();
		}
	}

	public getLayerTransformContainer(layerId: string) {
		return this.layerContainers[layerId].transformContainer;
	}
	public getLayerOwnContentContainer(layerId: string) {
		return this.layerContainers[layerId].ownContentContainer;
	}
	public getLayerChildLayerContainer(layerId: string) {
		return this.layerContainers[layerId].childLayerContainer;
	}

	// Send some diffs to the sub-composition managers.
	//
	// Those composition managers will send the diffs to their sub-composition
	// managers and so on.
	public sendDiffs(actionState: ActionState, _diffs: Diff[], direction: "forward" | "backward") {
		const keys = Object.keys(this.subCompositions);
		for (const key of keys) {
			const { manager, layerId } = this.subCompositions[key];
			const diffs = adjustDiffsToChildComposition(actionState, _diffs, layerId);
			manager.onDiffs(actionState, diffs, direction);
		}
	}

	public onFrameIndexChanged(actionState: ActionState, frameIndex: number) {
		const { compositionState } = actionState;
		const composition = compositionState.compositions[this.compositionId];

		for (const layerId of composition.layers) {
			const { index, length } = compositionState.layers[layerId];
			const visible = index <= frameIndex && index + length >= frameIndex;
			const lastVisible = this.layerToVisible[layerId];

			if (visible !== lastVisible) {
				const container = this.layerContainers[layerId].ownContentContainer;
				container.visible = visible;
				this.layerToVisible[layerId] = visible;
			}
		}
	}

	public getLayerAtPoint(actionState: ActionState, point: Vec2): string | undefined {
		const { compositionState } = actionState;
		const composition = compositionState.compositions[this.compositionId];

		for (const layerId of composition.layers) {
			const hitTestGraphic = this.hitTestManager.getGraphic(actionState, layerId);
			if (hitTestGraphic.containsPoint(point)) {
				return layerId;
			}
		}

		return undefined;
	}

	public updatePropertyStructure(actionState: ActionState, layerId: string) {
		this.addLayer(actionState, layerId);
	}

	public getLayerPropertyMap(layerId: string) {
		return this.layerPropertyMapMap[layerId];
	}
}
