import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import { LayerMatrices } from "~/composition/layer/constructLayerMatrix";
import { shapeLayerPreview } from "~/composition/layer/shapeLayerPreview";
import { LayerType } from "~/types";

const drawShapeLayerPreview = (
	actionState: ActionState,
	layer: Layer,
	areaId: string,
	matrices: LayerMatrices,
	mousePosition: Vec2,
	container: PIXI.Container,
) => {
	const addGraphic = (graphic: PIXI.Container, zIndex: number) => {
		graphic.zIndex = zIndex;
		container.addChild(graphic);
	};

	const normalToViewport = (vec2: Vec2) => Vec2.new(matrices.content.apply(vec2));

	shapeLayerPreview(actionState, areaId, addGraphic, layer, mousePosition, normalToViewport);
};

export const clearLayerSpecificPreviewGraphics = (container: PIXI.Container) => {
	container.removeChildren();
};

export const drawLayerSpecificPreviewGraphics = (
	actionState: ActionState,
	layerId: string,
	areaId: string,
	matrices: LayerMatrices,
	mousePosition: Vec2,
	container: PIXI.Container,
): PIXI.Container => {
	const layer = actionState.compositionState.layers[layerId];

	clearLayerSpecificPreviewGraphics(container);

	switch (layer.type) {
		case LayerType.Shape: {
			drawShapeLayerPreview(actionState, layer, areaId, matrices, mousePosition, container);
		}
	}

	return container;
};
