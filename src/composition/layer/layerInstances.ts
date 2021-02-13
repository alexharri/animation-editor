import * as PIXI from "pixi.js";
import { getDimensionsAndTransforms } from "~/composition/arrayModifier";
import { Layer } from "~/composition/compositionTypes";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { createLayerPIXITransforms } from "~/render/pixi/pixiTransform";

export const createLayerInstances = (
	actionState: ActionState,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	ownContentContainer: PIXI.Container,
	graphic: PIXI.Graphics,
) => {
	const { dimensions, transforms } = getDimensionsAndTransforms(
		layer.id,
		actionState,
		layerPropertyMap,
		getPropertyValue,
	);

	const pixiTransforms = createLayerPIXITransforms(dimensions, transforms);

	for (let i = 0; i < pixiTransforms.length; i++) {
		const g0 = new PIXI.Graphics(graphic.geometry);
		g0.transform.setFromMatrix(pixiTransforms[i].worldTransform);
		ownContentContainer.addChild(g0);
	}
};

export const updateLayerInstanceTransforms = (
	actionState: ActionState,
	layer: Layer,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	ownContentContainer: PIXI.Container,
) => {
	const { dimensions, transforms } = getDimensionsAndTransforms(
		layer.id,
		actionState,
		layerPropertyMap,
		getPropertyValue,
	);

	const pixiTransforms = createLayerPIXITransforms(dimensions, transforms);
	const children = ownContentContainer.children;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		child.transform.setFromMatrix(pixiTransforms[i].worldTransform);
	}
};
