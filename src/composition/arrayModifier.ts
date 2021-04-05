import * as PIXI from "pixi.js";
import { PropertyGroup } from "~/composition/compositionTypes";
import { getLayerRectDimensionsAndOffset } from "~/composition/layer/layerDimensions";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import {
	applyIndexTransformRotationCorrection,
	getPropertyIdsFromTransformGroupId,
	getRotationCorrectedPosition,
	getTransformFromTransformGroupId,
} from "~/composition/transformUtils";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { LayerDimension, TransformBehavior } from "~/types";

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
	propertyStore: PropertyStore,
): LayerDimension[] => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];

	const getWidthAndHeight = (): [width: number, height: number] => {
		const [width, height] = getLayerRectDimensionsAndOffset(
			actionState,
			layer,
			layerPropertyMap,
			propertyStore.getPropertyValue,
		);
		return [width, height];
	};

	const arrayModifiers = getLayerArrayModifiers(layerId, compositionState);
	const layerDimensions: LayerDimension[] = [];

	const getMatrix = (arrayModifier: typeof arrayModifiers[0]) => {
		const { rotationCorrectionId, transformGroupId } = arrayModifier;
		const rotationCorrection = propertyStore.getPropertyValue(rotationCorrectionId);
		const transformIds = getPropertyIdsFromTransformGroupId(transformGroupId, compositionState);

		let positionX = propertyStore.getPropertyValue(transformIds.positionX);
		let positionY = propertyStore.getPropertyValue(transformIds.positionY);
		const anchorX = propertyStore.getPropertyValue(transformIds.anchorX);
		const anchorY = propertyStore.getPropertyValue(transformIds.anchorY);
		const scaleX = propertyStore.getPropertyValue(transformIds.scaleX);
		const scaleY = propertyStore.getPropertyValue(transformIds.scaleY);
		const rotation = propertyStore.getPropertyValue(transformIds.rotation) * DEG_TO_RAD_FAC;

		[positionX, positionY] = getRotationCorrectedPosition(
			layer.type,
			positionX,
			positionY,
			scaleX,
			scaleY,
			rotation,
			rotationCorrection,
			getWidthAndHeight(),
		);

		const matrix = new PIXI.Matrix();
		matrix.setTransform(positionX, positionY, anchorX, anchorY, scaleX, scaleY, rotation, 0, 0);
		return matrix;
	};

	for (const arrayModifier of arrayModifiers) {
		const {
			modifierGroupId,
			countId,
			rotationCorrectionId,
			transformGroupId,
			transformBehaviorId,
		} = arrayModifier;
		const group = compositionState.properties[modifierGroupId] as PropertyGroup;
		const count = propertyStore.getPropertyValue(countId);
		const rotationCorrection = propertyStore.getPropertyValue(rotationCorrectionId);
		const transformIds = getPropertyIdsFromTransformGroupId(transformGroupId, compositionState);

		if (!group.graphId) {
			layerDimensions.push({ type: "array", count, matrix: getMatrix(arrayModifier) });
			continue;
		}

		const transformBehavior = propertyStore.getPropertyValue(
			transformBehaviorId,
		) as TransformBehavior;

		if (transformBehavior === "recursive") {
			const matrices: PIXI.Matrix[] = [];

			const getValue = (propertyId: string, i: number) => {
				return propertyStore.getPropertyValueAtIndex(propertyId, i);
			};

			for (let i = 0; i < count; i++) {
				let positionX = getValue(transformIds.positionX, i);
				let positionY = getValue(transformIds.positionY, i);
				const anchorX = getValue(transformIds.anchorX, i);
				const anchorY = getValue(transformIds.anchorY, i);
				const scaleX = getValue(transformIds.scaleX, i);
				const scaleY = getValue(transformIds.scaleY, i);
				const rotation = getValue(transformIds.rotation, i) * DEG_TO_RAD_FAC;

				[positionX, positionY] = getRotationCorrectedPosition(
					layer.type,
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

			layerDimensions.push({
				type: "array_with_graph_recursive",
				count,
				matrices,
			});
			continue;
		}

		const absoluteMatrices: PIXI.Matrix[] = [];

		const absolute = {
			positionX: propertyStore.propertyHasIndexValues(transformIds.positionX),
			positionY: propertyStore.propertyHasIndexValues(transformIds.positionY),
			anchorX: propertyStore.propertyHasIndexValues(transformIds.anchorX),
			anchorY: propertyStore.propertyHasIndexValues(transformIds.anchorY),
			scaleX: propertyStore.propertyHasIndexValues(transformIds.scaleX),
			scaleY: propertyStore.propertyHasIndexValues(transformIds.scaleY),
			rotation: propertyStore.propertyHasIndexValues(transformIds.rotation),
		};

		const atIndex = (propertyId: string, i: number) => {
			return propertyStore.getPropertyValueAtIndex(propertyId, i);
		};

		for (let i = 0; i < count; i++) {
			const absoluteMatrix = new PIXI.Matrix();
			absoluteMatrix.setTransform(
				absolute.positionX ? atIndex(transformIds.positionX, i) : 0,
				absolute.positionY ? atIndex(transformIds.positionY, i) : 0,
				absolute.anchorX ? atIndex(transformIds.anchorX, i) : 0,
				absolute.anchorY ? atIndex(transformIds.anchorY, i) : 0,
				absolute.scaleX ? atIndex(transformIds.scaleX, i) : 1,
				absolute.scaleY ? atIndex(transformIds.scaleY, i) : 1,
				absolute.rotation ? atIndex(transformIds.rotation, i) * DEG_TO_RAD_FAC : 0,
				0,
				0,
			);
			absoluteMatrices.push(absoluteMatrix);
		}

		layerDimensions.push({
			type: "array_with_graph",
			count,
			matrix: getMatrix(arrayModifier),
			absoluteMatrices,
		});
	}

	return layerDimensions;
};
