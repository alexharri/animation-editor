import * as PIXI from "pixi.js";
import { getLayerDimensions } from "~/composition/arrayModifier";
import { Layer } from "~/composition/compositionTypes";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { updatePixiLayerHitTestGraphic } from "~/render/pixi/layerToPixi";
import { getPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";
import { createLayerPIXITransforms } from "~/render/pixi/pixiTransform";
import { LayerDimension } from "~/types";

type ParentDimensions = LayerDimension[];

const getAllDimensionsAndMatrices = (
	actionState: ActionState,
	parentDimensions: ParentDimensions,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	getPropertyValueAtIndex: (propertyId: string, index: number) => any,
): PIXI.Matrix[] => {
	let layerDimensions = getLayerDimensions(
		layer.id,
		actionState,
		layerPropertyMap,
		getPropertyValue,
		getPropertyValueAtIndex,
	);

	const layerMatrix = getPixiLayerMatrix(layerPropertyMap, getPropertyValue);

	const parentMatrices = [];
	let parentLayer = actionState.compositionState.layers[layer.parentLayerId];
	while (parentLayer) {
		const parentMatrix = getPixiLayerMatrix(
			constructLayerPropertyMap(parentLayer.id, actionState.compositionState),
			getPropertyValue,
		);
		parentMatrices.push(parentMatrix);
		parentLayer = actionState.compositionState.layers[parentLayer.parentLayerId];
	}

	return createLayerPIXITransforms(
		parentDimensions,
		[...parentMatrices, layerMatrix],
		layerDimensions,
	);
};

export const createLayerInstances = (
	actionState: ActionState,
	parentDimensions: ParentDimensions,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	getPropertyValueAtIndex: (propertyId: string, index: number) => any,
	ownContentContainer: PIXI.Container,
	graphic: PIXI.Graphics,
) => {
	const pixiTransforms = getAllDimensionsAndMatrices(
		actionState,
		parentDimensions,
		layer,
		layerPropertyMap,
		getPropertyValue,
		getPropertyValueAtIndex,
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
	parentDimensions: ParentDimensions,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	getPropertyValueAtIndex: (propertyId: string, index: number) => any,
	ownContentContainer: PIXI.Container,
) => {
	const pixiTransforms = getAllDimensionsAndMatrices(
		actionState,
		parentDimensions,
		layer,
		layerPropertyMap,
		getPropertyValue,
		getPropertyValueAtIndex,
	);

	const children = ownContentContainer.children;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		child.transform.setFromMatrix(pixiTransforms[i]);
	}
};
