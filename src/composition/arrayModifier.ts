import { getLayerRectDimensionsAndOffset } from "~/composition/layer/layerDimensions";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import {
	applyIndexTransformRotationCorrection,
	getTransformFromTransformGroupId,
} from "~/composition/transformUtils";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import { DEFAULT_LAYER_TRANSFORM } from "~/constants";

export const getDimensionsAndTransforms = (
	layerId: string,
	actionState: ActionState,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
) => {
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
		return { dimensions: [1], transforms: [DEFAULT_LAYER_TRANSFORM] };
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

	return { dimensions, transforms };
};
