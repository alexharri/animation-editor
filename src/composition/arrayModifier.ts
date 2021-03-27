import * as PIXI from "pixi.js";
import { getLayerRectDimensionsAndOffset } from "~/composition/layer/layerDimensions";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import {
	applyIndexTransformRotationCorrection,
	getTransformFromTransformGroupId,
} from "~/composition/transformUtils";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";

export const getDimensionsAndMatrices = (
	layerId: string,
	actionState: ActionState,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
): { dimensions: number[]; matrices: PIXI.Matrix[] } => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];

	const getWidthAndHeight = (): [width: number, height: number] => {
		const [width, height] = getLayerRectDimensionsAndOffset(
			actionState,
			layer,
			layerPropertyMap,
			getPropertyValue,
		);
		return [width, height];
	};

	const arrayModifiers = getLayerArrayModifiers(layerId, compositionState);
	const resolvedModifiers = arrayModifiers.map((modifier) => {
		const transform = getTransformFromTransformGroupId(
			modifier.transformGroupId,
			compositionState,
			getPropertyValue,
		);
		return {
			count: getPropertyValue(modifier.countId),
			rotationCorrection: getPropertyValue(modifier.rotationCorrectionId),
			transform,
		};
	});

	if (resolvedModifiers.length < 1) {
		return { dimensions: [1], matrices: [new PIXI.Matrix()] };
	}

	const dimensions = resolvedModifiers.map((item) => item.count);
	const transforms = resolvedModifiers.map(({ transform, rotationCorrection }) => {
		if (rotationCorrection === 0) {
			return transform;
		}
		const [width, height] = getWidthAndHeight();
		return applyIndexTransformRotationCorrection(transform, rotationCorrection, [
			width,
			height,
		]);
	});
	const matrices = transforms.map((transform) => {
		const matrix = new PIXI.Matrix();
		matrix.setTransform(
			transform.translate.x,
			transform.translate.y,
			transform.anchor.x,
			transform.anchor.y,
			transform.scaleX,
			transform.scaleY,
			transform.rotation,
			0,
			0,
		);
		return matrix;
	});

	return { dimensions, matrices };
};
