import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import { LayerMatrices } from "~/composition/layer/constructLayerMatrix";
import { shapeLayerInteractions } from "~/composition/layer/shapeLayerInteraction";
import { LayerType } from "~/types";

const drawShapeLayerInteractions = (
	actionState: ActionState,
	layer: Layer,
	areaId: string,
	matrices: LayerMatrices,
	container: PIXI.Container,
) => {
	const addGraphic = (graphic: PIXI.Container, zIndex: number) => {
		graphic.zIndex = zIndex;
		container.addChild(graphic);
	};

	shapeLayerInteractions(actionState, areaId, addGraphic, layer, (vec2) =>
		Vec2.new(matrices.content.apply(vec2)),
	);
};

export const createLayerSpecificInteractionGraphics = (
	actionState: ActionState,
	layerId: string,
	areaId: string,
	matrices: LayerMatrices,
): PIXI.Container => {
	const container = new PIXI.Container();
	container.sortableChildren = true;

	const layer = actionState.compositionState.layers[layerId];

	switch (layer.type) {
		case LayerType.Shape: {
			drawShapeLayerInteractions(actionState, layer, areaId, matrices, container);
		}
	}

	return container;
};
