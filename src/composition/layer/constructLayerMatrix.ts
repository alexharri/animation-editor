import * as PIXI from "pixi.js";
import { LayerManager } from "~/composition/layer/layerManager";
import { PropertyManager } from "~/composition/manager/property/propertyManager";
import { getPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";

export type LayerMatrices = { content: PIXI.Matrix; position: PIXI.Matrix };

export const createLayerViewportMatrices = (
	actionState: ActionState,
	layers: LayerManager,
	properties: PropertyManager,
	layerId: string,
	scale: number,
): LayerMatrices => {
	const { compositionState } = actionState;

	const layer = compositionState.layers[layerId];

	const contentMatrix = new PIXI.Matrix();
	contentMatrix.scale(scale, scale);

	const toAppend: PIXI.Matrix[] = [];

	let parentLayerId = layer.parentLayerId;
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
	toAppend.forEach((parentMatrix) => contentMatrix.append(parentMatrix));

	const positionMatrix = new PIXI.Matrix();
	positionMatrix.append(contentMatrix);

	contentMatrix.append(
		getPixiLayerMatrix(layers.getLayerPropertyMap(layer.id), properties.getPropertyValue, {
			applyAnchor: true,
		}),
	);
	positionMatrix.append(
		getPixiLayerMatrix(layers.getLayerPropertyMap(layer.id), properties.getPropertyValue, {
			applyAnchor: false,
		}),
	);

	return { content: contentMatrix, position: positionMatrix };
};
