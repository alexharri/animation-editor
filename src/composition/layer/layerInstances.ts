import * as PIXI from "pixi.js";
import { getArrayModifierLayerDimensions } from "~/composition/arrayModifier";
import { Layer } from "~/composition/compositionTypes";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { updatePixiLayerHitTestGraphic } from "~/render/pixi/layerToPixi";
import { getPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";
import { createLayerPIXITransforms } from "~/render/pixi/pixiTransform";
import { LayerDimension } from "~/types";

const getAllDimensionsAndMatrices = (
	actionState: ActionState,
	parentDimensions: LayerDimension[],
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	propertyStore: PropertyStore,
): PIXI.Matrix[] => {
	const arrayModifierLayerDimensions = getArrayModifierLayerDimensions(
		layer.id,
		actionState,
		layerPropertyMap,
		propertyStore,
	);

	const layerMatrix = getPixiLayerMatrix(layerPropertyMap, propertyStore.getPropertyValue);

	const parentLayerMatrices = [];
	let parentLayer = actionState.compositionState.layers[layer.parentLayerId];
	while (parentLayer) {
		const parentMatrix = getPixiLayerMatrix(
			constructLayerPropertyMap(parentLayer.id, actionState.compositionState),
			propertyStore.getPropertyValue,
		);
		parentLayerMatrices.push(parentMatrix);
		parentLayer = actionState.compositionState.layers[parentLayer.parentLayerId];
	}

	const matrix = new PIXI.Matrix();
	for (const parentLayerMatrix of parentLayerMatrices) {
		matrix.append(parentLayerMatrix);
	}
	matrix.append(layerMatrix);

	return createLayerPIXITransforms([
		...parentDimensions,
		{ type: "parent", count: 1, matrix },
		...arrayModifierLayerDimensions,
	]);
};

export const createLayerInstances = (
	actionState: ActionState,
	parentDimensions: LayerDimension[],
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	propertyStore: PropertyStore,
	ownContentContainer: PIXI.Container,
	graphic: PIXI.Graphics,
) => {
	const pixiTransforms = getAllDimensionsAndMatrices(
		actionState,
		parentDimensions,
		layer,
		layerPropertyMap,
		propertyStore,
	);

	for (let i = 0; i < pixiTransforms.length; i++) {
		const g0 = new PIXI.Graphics(graphic.geometry);
		g0.transform.setFromMatrix(pixiTransforms[i]);
		ownContentContainer.addChild(g0);
	}
};

export const drawHitTestGraphic = (
	actionState: ActionState,
	layerId: string,
	hitTestGraphic: PIXI.Graphics,
	getPropertyValue: (propertyId: string) => any,
) => {
	updatePixiLayerHitTestGraphic(actionState, layerId, hitTestGraphic, getPropertyValue);
};

export const updateLayerInstanceTransforms = (
	actionState: ActionState,
	parentDimensions: LayerDimension[],
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	propertyStore: PropertyStore,
	ownContentContainer: PIXI.Container,
) => {
	const pixiTransforms = getAllDimensionsAndMatrices(
		actionState,
		parentDimensions,
		layer,
		layerPropertyMap,
		propertyStore,
	);

	const children = ownContentContainer.children;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		child.transform.setFromMatrix(pixiTransforms[i]);
	}
};
