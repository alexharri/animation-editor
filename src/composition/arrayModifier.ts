import * as PIXI from "pixi.js";
import { PropertyGroup } from "~/composition/compositionTypes";
import { getLayerRectDimensionsAndOffset } from "~/composition/layer/layerDimensions";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import {
	applyIndexTransformRotationCorrection,
	getPropertyIdsFromTransformGroupId,
	getRotationCorrectedPosition,
	getTransformFromTransformGroupId,
} from "~/composition/transformUtils";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { LayerDimension } from "~/types";

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

export const getLayerDimensions = (
	layerId: string,
	actionState: ActionState,
	layerPropertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
	getPropertyValueAtIndex: (propertyId: string, index: number) => any,
): LayerDimension[] => {
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
	const layerDimensions: LayerDimension[] = [];

	for (const arrayModifier of arrayModifiers) {
		const { modifierGroupId, countId, rotationCorrectionId, transformGroupId } = arrayModifier;
		const group = compositionState.properties[modifierGroupId] as PropertyGroup;
		const count = getPropertyValue(countId);
		const rotationCorrection = getPropertyValue(rotationCorrectionId);
		const transformIds = getPropertyIdsFromTransformGroupId(transformGroupId, compositionState);

		if (!group.graphId) {
			let positionX = getPropertyValue(transformIds.positionX);
			let positionY = getPropertyValue(transformIds.positionY);
			const anchorX = getPropertyValue(transformIds.anchorX);
			const anchorY = getPropertyValue(transformIds.anchorY);
			const scaleX = getPropertyValue(transformIds.scaleX);
			const scaleY = getPropertyValue(transformIds.scaleY);
			const rotation = getPropertyValue(transformIds.rotation) * DEG_TO_RAD_FAC;

			[positionX, positionY] = getRotationCorrectedPosition(
				positionX,
				positionY,
				scaleX,
				scaleY,
				rotation,
				rotationCorrection,
				getWidthAndHeight(),
			);

			const matrix = new PIXI.Matrix();
			matrix.setTransform(
				positionX,
				positionY,
				anchorX,
				anchorY,
				scaleX,
				scaleY,
				rotation,
				0,
				0,
			);
			layerDimensions.push({ type: "array", count, matrix });
			continue;
		}

		const matrices: PIXI.Matrix[] = [];

		for (let i = 0; i < count; i++) {
			let positionX = getPropertyValueAtIndex(transformIds.positionX, i);
			let positionY = getPropertyValueAtIndex(transformIds.positionY, i);
			const anchorX = getPropertyValueAtIndex(transformIds.anchorX, i);
			const anchorY = getPropertyValueAtIndex(transformIds.anchorY, i);
			const scaleX = getPropertyValueAtIndex(transformIds.scaleX, i);
			const scaleY = getPropertyValueAtIndex(transformIds.scaleY, i);
			const rotation = getPropertyValueAtIndex(transformIds.rotation, i) * DEG_TO_RAD_FAC;

			[positionX, positionY] = getRotationCorrectedPosition(
				positionX,
				positionY,
				scaleX,
				scaleY,
				rotation,
				rotationCorrection,
				getWidthAndHeight(),
			);

			const matrix = new PIXI.Matrix();
			matrix.setTransform(
				positionX,
				positionY,
				anchorX,
				anchorY,
				scaleX,
				scaleY,
				rotation,
				0,
				0,
			);
			matrices.push(matrix);
		}

		layerDimensions.push({ type: "array_with_graph", count, matrices });
	}

	return layerDimensions;
};
