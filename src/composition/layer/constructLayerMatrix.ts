import * as PIXI from "pixi.js";
import { constructLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { getPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";

export type LayerMatrices = { content: PIXI.Matrix; position: PIXI.Matrix };

export const createLayerViewportMatrices = (
	actionState: ActionState,
	getPropertyValue: (propertyId: string) => any,
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
			constructLayerPropertyMap(parentLayerId, compositionState),
			getPropertyValue,
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
		getPixiLayerMatrix(
			constructLayerPropertyMap(layer.id, compositionState),
			getPropertyValue,
			{
				applyAnchor: true,
			},
		),
	);
	positionMatrix.append(
		getPixiLayerMatrix(
			constructLayerPropertyMap(layer.id, compositionState),
			getPropertyValue,
			{
				applyAnchor: false,
			},
		),
	);

	return { content: contentMatrix, position: positionMatrix };
};
