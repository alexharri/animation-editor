import * as PIXI from "pixi.js";
import { getArrayModifierLayerDimensions } from "~/composition/arrayModifier";
import {
	createLayerInstances,
	updateLayerInstanceTransforms,
} from "~/composition/layer/layerInstances";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { manageComposition } from "~/composition/manager/compositionManager";
import { GraphicManager } from "~/composition/manager/graphic/GraphicManager";
import { HitTestManager } from "~/composition/manager/hitTest/HitTestManager";
import { InteractionManager } from "~/composition/manager/interaction/interactionManager";
import { populateLayerManager } from "~/composition/manager/populateLayerManager";
import { PropertyManager } from "~/composition/manager/property/propertyManager";
import { DEG_TO_RAD_FAC } from "~/constants";
import { adjustDiffsToChildComposition } from "~/diff/adjustDiffsToChildComposition";
import { Diff } from "~/diff/diffs";
import { applyPixiLayerTransform, getPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";
import { getLayerChildLayers } from "~/shared/layer/layerParentSort";
import {
	LayerDimension,
	LayerType,
	Performable,
	PropertyName,
	TransformPropertyName,
} from "~/types";

export interface LayerPixiContainers {
	transformContainer: PIXI.Container;
	childLayerContainer: PIXI.Container;
	ownContentContainer: PIXI.Container;
	instanceContainer: PIXI.Container;
}

type Subcomposition = { layerId: string; manager: ReturnType<typeof manageComposition> };

interface Options {
	compositionId: string;
	compositionContainer: PIXI.Container;
	propertyManager: PropertyManager;
	interactionManager: InteractionManager;
	hitTestManager: HitTestManager;
	actionState: ActionState;
	depth: number;
	dimensions?: LayerDimension[];
}

export class LayerManager {
	public compositionId: string;

	private options: Options;
	private graphicManager: GraphicManager;
	private interactionManager: InteractionManager;
	private hitTestManager: HitTestManager;
	private propertyManager: PropertyManager;
	private layerContainers: Record<string, LayerPixiContainers> = {};
	private layerToVisible: Record<string, boolean> = {};
	private subCompositions: Record<string, Subcomposition> = {};
	private layerPropertyMapMap: Record<string, LayerPropertyMap> = {};
	private parentDimensions: LayerDimension[];

	constructor(options: Options) {
		this.options = options;
		this.compositionId = this.options.compositionId;
		this.interactionManager = this.options.interactionManager;
		this.hitTestManager = this.options.hitTestManager;
		this.propertyManager = this.options.propertyManager;

		this.graphicManager = new GraphicManager({ propertyManager: options.propertyManager });

		this.parentDimensions = this.options.dimensions || [];

		populateLayerManager(this.options.actionState, this);
	}

	public updateLayerZIndices(actionState: ActionState) {
		const composition = actionState.compositionState.compositions[this.compositionId];

		for (let i = 0; i < composition.layers.length; i++) {
			const layerId = composition.layers[i];
			const container = this.getLayerTransformContainer(layerId);
			container.zIndex = composition.layers.length - i;
		}
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
		const instanceContainer = new PIXI.Container();
		const ownContentContainer = new PIXI.Container();
		const childLayerContainer = new PIXI.Container();

		this.layerContainers[layerId] = {
			transformContainer,
			ownContentContainer,
			childLayerContainer,
			instanceContainer,
		};

		// The layer's transform affects both its own content and the content
		// of its child layers, so we add both to the transform container.
		transformContainer.addChild(ownContentContainer);
		transformContainer.addChild(childLayerContainer);

		if (layer.type !== LayerType.Composition) {
			this.graphicManager.getLayerGraphic(actionState, layer);
		}

		const hitTestGraphic = this.hitTestManager.getGraphic(actionState, layerId);
		transformContainer.addChild(hitTestGraphic);

		const { store } = this.propertyManager;
		const map = constructLayerPropertyMap(layerId, actionState.compositionState);

		applyPixiLayerTransform(transformContainer, map, store.getPropertyValue);

		let parentContainer = this.options.compositionContainer;
		if (layer.parentLayerId) {
			parentContainer = this.getLayerChildLayerContainer(layer.parentLayerId);
		}

		// Add the layer to the parent container
		parentContainer.addChild(transformContainer);
		this.options.compositionContainer.addChild(instanceContainer);

		this.layerPropertyMapMap[layerId] = constructLayerPropertyMap(
			layerId,
			actionState.compositionState,
		);
		this.layerToVisible[layerId] = true;

		if (layer.type !== LayerType.Composition) {
			createLayerInstances(
				actionState,
				this.parentDimensions,
				layer,
				this.layerPropertyMapMap[layerId],
				store,
				instanceContainer,
				this.graphicManager.getLayerGraphic(actionState, layer),
			);
		}

		if (layer.type === LayerType.Composition) {
			// The layer is a composition layer.
			//
			// We don't render the composition directly. Instead we create a
			// sub-composition manager which takes care of keeping the content
			// of the layer container up to date.
			const { compositionState } = actionState;
			const compositionId = compositionState.compositionLayerIdToComposition[layerId];
			const parentCompContainer = instanceContainer;
			const manager = manageComposition({
				parentCompContainer,
				compositionId,
				dimensions: [
					...this.parentDimensions,
					...this.getCompositionLayerParentDimensions(actionState, layerId),
				],
				depth: this.options.depth + 1,
			});
			this.subCompositions[layerId] = { manager, layerId: layerId };
		}
	}

	public removeLayer(layerId: string) {
		// Destroy the PIXI container
		const { transformContainer, instanceContainer } = this.layerContainers[layerId];

		for (const container of [transformContainer, instanceContainer]) {
			container.parent.removeChild(container);
			container.destroy({ children: true }); // Also destroys ownContent
		}

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

		this.executePerformable(actionState, layerId, Performable.UpdateTransform);
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
		this.executePerformable(actionState, layerId, Performable.DrawLayer);
		this.executePerformable(actionState, layerId, Performable.UpdateTransform);
		this.executePerformable(actionState, layerId, Performable.UpdateArrayModifierTransform);
		this.executePerformable(actionState, layerId, Performable.UpdateArrayModifierCount);
	}

	public executePerformable(actionState: ActionState, layerId: string, performable: Performable) {
		const layer = actionState.compositionState.layers[layerId];

		switch (performable) {
			case Performable.DrawLayer: {
				if (layer.type !== LayerType.Composition) {
					this.graphicManager.updateLayerGraphic(actionState, layer);
				}
				this.interactionManager.update(actionState, layerId);
				this.hitTestManager.update(actionState, layerId);
				break;
			}
			case Performable.UpdatePosition: {
				this.updatePosition(layerId);
				this.interactionManager.updateOwnAndChildLayerGuides(actionState, layerId);
				// break;
			}
			case Performable.UpdateTransform: {
				this.updateTransform(layerId);
				this.interactionManager.updateOwnAndChildLayerGuides(actionState, layerId);
				// break;
			}

			case Performable.UpdateArrayModifierCount: {
				if (layer.type !== LayerType.Composition) {
					const instancesContainer = this.getLayerInstancesContainer(layer.id);
					instancesContainer.removeChildren();

					createLayerInstances(
						actionState,
						this.parentDimensions,
						layer,
						this.layerPropertyMapMap[layerId],
						this.propertyManager.store,
						instancesContainer,
						this.graphicManager.getLayerGraphic(actionState, layer),
					);
				} else {
					const { manager } = this.subCompositions[layer.id];
					manager.layers.onDimensionsChange(actionState, [
						...this.parentDimensions,
						...this.getCompositionLayerParentDimensions(actionState, layerId),
					]);
				}

				const childLayers = getLayerChildLayers(layerId, actionState.compositionState);
				for (const layerId of childLayers) {
					this.executePerformable(actionState, layerId, performable);
				}
				break;
			}

			case Performable.UpdatePosition:
			case Performable.UpdateTransform:
			case Performable.UpdateArrayModifierTransform: {
				const instancesContainer = this.getLayerInstancesContainer(layer.id);

				if (layer.type !== LayerType.Composition) {
					updateLayerInstanceTransforms(
						actionState,
						this.parentDimensions,
						layer,
						this.layerPropertyMapMap[layerId],
						this.propertyManager.store,
						instancesContainer,
					);
				} else {
					const { manager } = this.subCompositions[layer.id];
					manager.layers.onDimensionsUpdate(actionState, [
						...this.parentDimensions,
						...this.getCompositionLayerParentDimensions(actionState, layerId),
					]);
				}
				break;
			}
		}
	}

	public onDimensionsChange(actionState: ActionState, dimensions: LayerDimension[]) {
		this.parentDimensions = dimensions;
		const composition = actionState.compositionState.compositions[this.compositionId];
		for (const layerId of composition.layers) {
			/**
			 * @todo this current does not consider that updating a layer also updates
			 * that childs layers. A lot of work may be being repeated here.
			 */
			this.executePerformable(actionState, layerId, Performable.UpdateArrayModifierCount);
		}
	}

	public onDimensionsUpdate(actionState: ActionState, dimensions: LayerDimension[]) {
		this.parentDimensions = dimensions;
		const composition = actionState.compositionState.compositions[this.compositionId];
		for (const layerId of composition.layers) {
			/**
			 * @todo this current does not consider that updating a layer also updates
			 * that childs layers. A lot of work may be being repeated here.
			 */
			this.executePerformable(actionState, layerId, Performable.UpdateArrayModifierTransform);
		}
	}

	private getLayerTransformContainer(layerId: string) {
		return this.layerContainers[layerId].transformContainer;
	}

	// private getLayerOwnContentContainer(layerId: string) {
	// 	return this.layerContainers[layerId].ownContentContainer;
	// }

	private getLayerInstancesContainer(layerId: string) {
		return this.layerContainers[layerId].instanceContainer;
	}

	private getLayerChildLayerContainer(layerId: string) {
		return this.layerContainers[layerId].childLayerContainer;
	}

	private getCompositionLayerParentDimensions(
		actionState: ActionState,
		layerId: string,
	): LayerDimension[] {
		const layerMatrix = getPixiLayerMatrix(
			this.layerPropertyMapMap[layerId],
			this.propertyManager.getPropertyValue,
		);

		const layerDimensions = getArrayModifierLayerDimensions(
			layerId,
			actionState,
			this.layerPropertyMapMap[layerId],
			this.propertyManager.store,
		);

		return [{ type: "parent", count: 1, matrix: layerMatrix }, ...layerDimensions];
	}

	private getLayerPropertyMap(layerId: string) {
		return this.layerPropertyMapMap[layerId];
	}

	private updateTransform(layerId: string) {
		const container = this.getLayerTransformContainer(layerId);

		const map = this.getLayerPropertyMap(layerId);
		const getPropertyValueByName = (name: TransformPropertyName): any => {
			return this.propertyManager.getPropertyValue(map[name]);
		};

		const xPos = getPropertyValueByName(PropertyName.PositionX);
		const yPos = getPropertyValueByName(PropertyName.PositionY);
		const xAnchor = getPropertyValueByName(PropertyName.AnchorX);
		const yAnchor = getPropertyValueByName(PropertyName.AnchorY);
		const xScale = getPropertyValueByName(PropertyName.ScaleX);
		const yScale = getPropertyValueByName(PropertyName.ScaleY);
		const rotation = getPropertyValueByName(PropertyName.Rotation);

		container.position.set(xPos, yPos);
		container.scale.set(xScale, yScale);
		container.pivot.set(xAnchor, yAnchor);
		container.rotation = rotation * DEG_TO_RAD_FAC;
	}

	private updatePosition(layerId: string) {
		const container = this.getLayerTransformContainer(layerId);
		const map = this.layerPropertyMapMap[layerId];
		const x = this.propertyManager.getPropertyValue(map[PropertyName.PositionX]);
		const y = this.propertyManager.getPropertyValue(map[PropertyName.PositionY]);
		container.position.set(x, y);
	}
}
