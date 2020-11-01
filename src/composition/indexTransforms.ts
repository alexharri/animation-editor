import { CompositionState } from "~/composition/compositionReducer";
import { PropertyGroup } from "~/composition/compositionTypes";
import { DEG_TO_RAD_FAC } from "~/constants";
import {
	ArrayModifierPropertyValueMap,
	CompoundPropertyName,
	LayerTransform,
	OriginBehavior,
	PropertyName,
	PropertyValueMap,
	TransformBehavior,
} from "~/types";
import { rotateVec2CCW } from "~/util/math";
import { Mat2 } from "~/util/math/mat";

const applyIndexTransform = (
	indexTransform: LayerTransform,
	transform: LayerTransform,
	correction: number,
): LayerTransform => {
	const relative = transform.originBehavior === "relative";

	const { matrix } = transform;
	const { rotation, scaleX, scaleY } = relative ? transform : indexTransform;

	const origin = relative
		? transform.translate.add(transform.anchor).sub(indexTransform.anchor).add(transform.origin)
		: transform.origin;

	let translate = transform.translate;

	if (relative) {
		const rt = 1 - correction;
		translate = translate.add(indexTransform.translate.rotate(indexTransform.rotation * rt));
	}

	if (rotation !== 0) {
		translate = rotateVec2CCW(translate, rotation, origin);
	}
	if (scaleX !== 1 || scaleY !== 1) {
		translate = translate.scaleXY(scaleX, scaleY, origin);
	}

	return {
		origin: transform.origin,
		originBehavior: transform.originBehavior,
		translate,
		anchor: indexTransform.anchor,
		rotation: indexTransform.rotation + transform.rotation,
		scaleX: indexTransform.scaleX * transform.scaleX,
		scaleY: indexTransform.scaleY * transform.scaleY,
		matrix: matrix.multiply(indexTransform.matrix),
	};
};

const getIndexTransformMapRecursive = (
	_transform: LayerTransform,
	indexTransforms: LayerTransform[],
	count: number,
	correction: number,
): { [index: number]: LayerTransform } => {
	let transform: LayerTransform = {
		origin: indexTransforms[0].origin,
		originBehavior: indexTransforms[0].originBehavior,
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
	correction: number,
	origin: Vec2,
	originBehavior: OriginBehavior,
): { [index: number]: LayerTransform } => {
	let transform: LayerTransform = {
		origin,
		originBehavior,
		translate: Vec2.ORIGIN,
		anchor: Vec2.new(0, 0),
		rotation: 0,
		scaleX: 1,
		scaleY: 1,
		matrix: Mat2.identity(),
	};

	const transforms: { [index: number]: LayerTransform } = {
		[0]: {
			origin,
			originBehavior,
			translate: Vec2.ORIGIN,
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
				origin: transform.origin.copy(),
				originBehavior: transform.originBehavior,
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
	origin: Vec2,
	originBehavior: OriginBehavior,
): { [index: number]: LayerTransform } => {
	switch (behavior) {
		case "absolute_for_computed":
			return getIndexTransformMapAbsoluteForComputed(
				indexTransforms,
				count,
				isComputedByIndex,
				correction,
				origin,
				originBehavior,
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
	dimensions: [width: number, height: number],
): LayerTransform => {
	const origin =
		indexTransform.originBehavior === "relative" ? indexTransform.origin : Vec2.ORIGIN;

	const [width, height] = dimensions;
	const atRot = indexTransform.translate
		.sub(Vec2.new(width, height))
		.scale(0.5)
		.add(Vec2.new(width, height));
	const diff = indexTransform.translate.sub(atRot);
	const dr = diff.rotate(indexTransform.rotation, origin);
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
	origin: Vec2,
	originBehavior: OriginBehavior,
): { [index: number]: LayerTransform } => {
	const transformGroup = compositionState.properties[transformGroupId] as PropertyGroup;

	const indexTransforms: LayerTransform[] = [];
	const isComputedByIndex: { [key: string]: boolean } = {};

	for (let i = 0; i < count; i += 1) {
		const transform: LayerTransform = {
			origin,
			originBehavior,
		} as any;

		for (const propertyId of transformGroup.properties) {
			const property = compositionState.properties[propertyId];
			const hasComputedByIndex = !!arrayModifierPropertyToValue[propertyId];

			if (property.type === "property") {
				isComputedByIndex[property.name] = hasComputedByIndex;
			}

			switch (property.name) {
				case CompoundPropertyName.Position: {
					const [xId, yId] = property.properties;

					const xValue = hasComputedByIndex
						? arrayModifierPropertyToValue[xId][i]
						: propertyToValue[xId].computedValue;

					const yValue = hasComputedByIndex
						? arrayModifierPropertyToValue[yId][i]
						: propertyToValue[yId].computedValue;

					transform.translate = Vec2.new(xValue, yValue);
					break;
				}

				case CompoundPropertyName.Anchor: {
					const [xId, yId] = property.properties;

					const xValue = hasComputedByIndex
						? arrayModifierPropertyToValue[xId][i]
						: propertyToValue[xId].computedValue;

					const yValue = hasComputedByIndex
						? arrayModifierPropertyToValue[yId][i]
						: propertyToValue[yId].computedValue;

					transform.anchor = Vec2.new(xValue, yValue);
					break;
				}

				case CompoundPropertyName.Scale: {
					const [xId, yId] = property.properties;

					const xValue = hasComputedByIndex
						? arrayModifierPropertyToValue[xId][i]
						: propertyToValue[xId].computedValue;

					const yValue = hasComputedByIndex
						? arrayModifierPropertyToValue[yId][i]
						: propertyToValue[yId].computedValue;

					transform.scaleX = xValue;
					transform.scaleY = yValue;
					break;
				}

				case PropertyName.Rotation: {
					const value = hasComputedByIndex
						? arrayModifierPropertyToValue[propertyId][i]
						: propertyToValue[propertyId].computedValue;
					transform.rotation = value * DEG_TO_RAD_FAC;
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
		origin,
		originBehavior,
	);
};
