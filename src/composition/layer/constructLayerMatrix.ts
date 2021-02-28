import * as PIXI from "pixi.js";
import { LayerManager } from "~/composition/layer/layerManager";
import { PropertyManager } from "~/composition/manager/propertyManager";
import { getPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";

export const constructLayerMatrix = (
	actionState: ActionState,
	layers: LayerManager,
	properties: PropertyManager,
	layerId: string,
	scale: number,
): PIXI.Matrix => {
	const { compositionState } = actionState;

	const layer = compositionState.layers[layerId];

	const matrix = new PIXI.Matrix();

	matrix.scale(scale, scale);

	const toAppend: PIXI.Matrix[] = [];

	let parentLayerId = layer.id;
	while (parentLayerId) {
		const parentMatrix = getPixiLayerMatrix(
			layers.getLayerPropertyMap(parentLayerId),
			properties.getPropertyValue,
		);
		toAppend.push(parentMatrix);

		const parentLayer = compositionState.layers[parentLayerId];
		parentLayerId = parentLayer.parentLayerId;
	}

	toAppend.reverse();
	toAppend.forEach((parentMatrix) => matrix.append(parentMatrix));

	return matrix;
};
