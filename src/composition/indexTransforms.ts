import { CompositionState } from "~/composition/compositionReducer";
import { CompositionPropertyGroup } from "~/composition/compositionTypes";
import { DEG_TO_RAD_FAC } from "~/constants";
import {
	ArrayModifierPropertyValueMap,
	LayerTransform,
	PropertyName,
	PropertyValueMap,
	TransformBehavior,
} from "~/types";
import { rotateVec2CCW } from "~/util/math";
import { Mat2 } from "~/util/math/mat";

type Correction = number;

const applyIndexTransform = (
	indexTransform: LayerTransform,
	transform: LayerTransform,
	correction: Correction = 0,
): LayerTransform => {
	const { rotation, scaleX, scaleY, matrix } = transform;

	const anchor = indexTransform.anchor;
	const origin = transform.translate.add(transform.anchor).sub(anchor);

	const rt = 1 - correction;

	let translate = transform.translate.add(
		indexTransform.translate.rotate(indexTransform.rotation * rt),
	);

	if (rotation !== 0) {
		translate = rotateVec2CCW(translate, rotation, origin);
	}
	if (scaleX !== 1 || scaleY !== 1) {
		translate = translate.scaleXY(scaleX, scaleY, origin);
	}

	return {
		translate,
		anchor,
		rotation: indexTransform.rotation + rotation,
		scaleX: indexTransform.scaleX * scaleX,
		scaleY: indexTransform.scaleY * scaleY,
		matrix: matrix.multiply(indexTransform.matrix),
	};
};

const getIndexTransformMapRecursive = (
	_transform: LayerTransform,
	indexTransforms: LayerTransform[],
	count: number,
	correction: Correction,
): { [index: number]: LayerTransform } => {
	let transform: LayerTransform = {
		translate: Vec2.new(0, 0),
		anchor: indexTransforms[0].anchor,
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		matrix: Mat2.identity(),
	};

	const transforms: { [index: number]: LayerTransform } = {
		[0]: transform,
	};

	for (let i = 1; i < count; i += 1) {
		transform = applyIndexTransform(indexTransforms[i], transform, correction);
		transforms[i] = transform;
	}

	return transforms;
};

const getIndexTransformMapAbsoluteForComputed = (
	indexTransforms: LayerTransform[],
	count: number,
	isComputedByIndex: { [key: string]: boolean },
	correction: Correction,
): { [index: number]: LayerTransform } => {
	let transform: LayerTransform = {
		translate: Vec2.new(0, 0),
		anchor: Vec2.new(0, 0),
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		matrix: Mat2.identity(),
	};

	const transforms: { [index: number]: LayerTransform } = {
		[0]: {
			translate: Vec2.new(0, 0),
			anchor: indexTransforms[0].anchor,
			rotation: 0,
			scaleX: 1,
			scaleY: 1,
			matrix: Mat2.identity(),
		},
	};

	const resetKey = (key: string) => {
		switch (parseInt(key)) {
			case PropertyName.AnchorX: {
				transform.anchor.x = 0;
				break;
			}
			case PropertyName.AnchorY: {
				transform.anchor.y = 0;
				break;
			}
			case PropertyName.PositionX: {
				transform.translate.x = 0;
				break;
			}
			case PropertyName.PositionY: {
				transform.translate.y = 0;
				break;
			}
			case PropertyName.Rotation: {
				transform.rotation = 0;
				break;
			}
			case PropertyName.ScaleX: {
				transform.scaleX = 1;
				break;
			}
			case PropertyName.ScaleY: {
				transform.scaleY = 1;
				break;
			}
		}
	};

	const computedKeys = Object.keys(isComputedByIndex).filter((key) => isComputedByIndex[key]);

	if (computedKeys.length) {
		for (const key of computedKeys) {
			switch (parseInt(key)) {
				case PropertyName.AnchorX: {
					transforms[0].anchor.x = indexTransforms[0].anchor.x;
					break;
				}
				case PropertyName.AnchorY: {
					transforms[0].anchor.y = indexTransforms[0].anchor.y;
					break;
				}
				case PropertyName.PositionX: {
					transforms[0].translate.x = indexTransforms[0].translate.x;
					break;
				}
				case PropertyName.PositionY: {
					transforms[0].translate.y = indexTransforms[0].translate.y;
					break;
				}
				case PropertyName.Rotation: {
					transforms[0].rotation = indexTransforms[0].rotation;
					break;
				}
				case PropertyName.ScaleX: {
					transforms[0].scaleX = indexTransforms[0].scaleX;
					break;
				}
				case PropertyName.ScaleY: {
					transforms[0].scaleY = indexTransforms[0].scaleY;
					break;
				}
			}
		}
	}

	for (let i = 1; i < count; i += 1) {
		transform = applyIndexTransform(indexTransforms[i], transform, correction);
		transforms[i] = transform;

		if (computedKeys.length) {
			transform = {
				anchor: transform.anchor.copy(),
				translate: transform.translate.copy(),
				rotation: transform.rotation,
				scaleX: transform.scaleX,
				scaleY: transform.scaleY,
				matrix: transform.matrix,
			};

			for (const key of computedKeys) {
				resetKey(key);
			}
		}
	}

	return transforms;
};

export const getIndexTransformMap = (
	transform: LayerTransform,
	indexTransforms: LayerTransform[],
	count: number,
	correction: number,
	isComputedByIndex: { [key: number]: boolean },
	behavior: TransformBehavior,
): { [index: number]: LayerTransform } => {
	switch (behavior) {
		case "absolute_for_computed":
			return getIndexTransformMapAbsoluteForComputed(
				indexTransforms,
				count,
				isComputedByIndex,
				correction,
			);

		case "recursive":
			return getIndexTransformMapRecursive(transform, indexTransforms, count, correction);

		default:
			throw new Error("No transform behavior provided");
	}
};

const correctIndexTransform = (
	indexTransform: LayerTransform,
	correction: number,
	[width, height]: [number, number],
): LayerTransform => {
	const atRot = indexTransform.translate
		.sub(Vec2.new(width, height))
		.scale(0.5)
		.add(Vec2.new(width, height));
	const diff = indexTransform.translate.sub(atRot);
	const dr = diff.rotate(indexTransform.rotation);
	const sum = atRot.add(dr);

	return {
		...indexTransform,
		translate: indexTransform.translate.lerp(sum, correction),
	};
};

export const getLayerArrayModifierIndexTransform = (
	compositionState: CompositionState,
	propertyToValue: PropertyValueMap,
	arrayModifierPropertyToValue: ArrayModifierPropertyValueMap,
	count: number,
	dimensions: [width: number, height: number],
	correction: number,
	transform: LayerTransform,
	transformGroupId: string,
	behavior: TransformBehavior,
): { [index: number]: LayerTransform } => {
	const transformGroup = compositionState.properties[
		transformGroupId
	] as CompositionPropertyGroup;

	const indexTransforms: LayerTransform[] = [];
	const isComputedByIndex: { [key: string]: boolean } = {};

	for (let i = 0; i < count; i += 1) {
		const transform: LayerTransform = {} as any;

		for (const propertyId of transformGroup.properties) {
			const property = compositionState.properties[propertyId];
			const hasComputedByIndex = !!arrayModifierPropertyToValue[propertyId];

			const value = hasComputedByIndex
				? arrayModifierPropertyToValue[propertyId][i]
				: propertyToValue[propertyId].computedValue;

			if (property.type === "property") {
				isComputedByIndex[property.name] = hasComputedByIndex;
			}

			switch (property.name) {
				case PropertyName.PositionX: {
					if (!transform.translate) {
						transform.translate = Vec2.new(0, 0);
					}
					transform.translate.x = value;
					break;
				}
				case PropertyName.PositionY: {
					if (!transform.translate) {
						transform.translate = Vec2.new(0, 0);
					}
					transform.translate.y = value;
					break;
				}
				case PropertyName.AnchorX: {
					if (!transform.anchor) {
						transform.anchor = Vec2.new(0, 0);
					}
					transform.anchor.x = value;
					break;
				}
				case PropertyName.AnchorY: {
					if (!transform.anchor) {
						transform.anchor = Vec2.new(0, 0);
					}
					transform.anchor.y = value;
					break;
				}
				case PropertyName.Rotation: {
					transform.rotation = value * DEG_TO_RAD_FAC;
					break;
				}
				case PropertyName.ScaleX: {
					transform.scaleX = value;
					break;
				}
				case PropertyName.ScaleY: {
					transform.scaleY = value;
					break;
				}
			}
		}

		transform.matrix = Mat2.identity()
			.scaleXY(transform.scaleX, transform.scaleY)
			.rotate(transform.rotation);
		indexTransforms.push(correctIndexTransform(transform, correction, dimensions));
	}

	return getIndexTransformMap(
		transform,
		indexTransforms,
		count,
		correction,
		isComputedByIndex,
		behavior,
	);
};
