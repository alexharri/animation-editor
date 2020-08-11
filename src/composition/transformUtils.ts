import { CompositionState } from "~/composition/compositionReducer";
import { CompositionProperty } from "~/composition/compositionTypes";
import {
	getLayerArrayModifierIndexTransform,
	getLayerArrayModifiers,
	getLayerCompositionProperties,
} from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { layerParentSort } from "~/shared/layer/layerParentSort";
import {
	AffineTransform,
	ArrayModifierPropertyValueMap,
	PropertyName,
	PropertyValueMap,
	TransformBehavior,
} from "~/types";
import { rotateVec2CCW } from "~/util/math";
import { Mat2 } from "~/util/math/mat";

interface LayerTransformMap {
	[layerId: string]: {
		transform: { [index: number]: AffineTransform };
		indexTransforms: Array<{
			[index: number]: AffineTransform;
		}>;
	};
}

export const transformMat2 = (transform: AffineTransform): Mat2 => {
	return Mat2.rotation(transform.rotation).scale(transform.scale);
};

export const getLayerTransformProperties = (
	layerId: string,
	compositionState: CompositionState,
) => {
	const props = getLayerCompositionProperties(layerId, compositionState).reduce<
		{ [key in keyof typeof PropertyName]: CompositionProperty }
	>((obj, p) => {
		(obj as any)[PropertyName[p.name]] = p;
		return obj;
	}, {} as any);

	return {
		anchorX: props.AnchorX,
		anchorY: props.AnchorY,
		positionX: props.PositionX,
		positionY: props.PositionY,
		rotation: props.Rotation,
		scale: props.Scale,
	};
};

const getBaseTransform = (
	layerId: string,
	propertyToValue: PropertyValueMap,
	compositionState: CompositionState,
): AffineTransform => {
	const props = getLayerCompositionProperties(layerId, compositionState).reduce<
		{ [key in keyof typeof PropertyName]: any }
	>((obj, p) => {
		const value = propertyToValue[p.id];
		(obj as any)[PropertyName[p.name]] = value.computedValue;
		return obj;
	}, {} as any);

	return {
		anchor: Vec2.new(props.AnchorX, props.AnchorY),
		rotation: props.Rotation * DEG_TO_RAD_FAC,
		scale: props.Scale,
		translate: Vec2.new(props.PositionX, props.PositionY),
	};
};

export const applyParentTransform = (
	transform: AffineTransform,
	parentTransform: AffineTransform,
	isBaseTransform: boolean,
): AffineTransform => {
	let translate = transform.translate;

	translate = translate.add(parentTransform.translate);

	if (isBaseTransform) {
		translate = translate.sub(parentTransform.anchor);
	}

	if (parentTransform.rotation !== 0) {
		translate = rotateVec2CCW(translate, parentTransform.rotation, parentTransform.translate);
	}
	if (parentTransform.scale !== 1) {
		translate = translate.scale(parentTransform.scale, parentTransform.translate);
	}

	return {
		translate,
		anchor: transform.anchor,
		rotation: transform.rotation + parentTransform.rotation,
		scale: transform.scale * parentTransform.scale,
	};
};

const applyIndexTransform = (
	indexTransform: AffineTransform,
	transform: AffineTransform,
): AffineTransform => {
	const { rotation, scale } = transform;

	const anchor = indexTransform.anchor;
	const origin = transform.translate.add(transform.anchor).sub(anchor);

	let translate = transform.translate.add(indexTransform.translate);

	if (rotation !== 0) {
		translate = rotateVec2CCW(translate, rotation, origin);
	}
	if (scale !== 1) {
		translate = translate.scale(scale, origin);
	}

	return {
		translate,
		anchor,
		rotation: indexTransform.rotation + rotation,
		scale: indexTransform.scale * scale,
	};
};

const getIndexTransformMapRecursive = (
	_transform: AffineTransform,
	indexTransforms: AffineTransform[],
	count: number,
): { [index: number]: AffineTransform } => {
	let transform: AffineTransform = {
		translate: Vec2.new(0, 0),
		anchor: indexTransforms[0].anchor,
		rotation: 0,
		scale: 1,
	};

	const transforms: { [index: number]: AffineTransform } = {
		[0]: transform,
	};

	for (let i = 1; i < count; i += 1) {
		transform = applyIndexTransform(indexTransforms[i], transform);
		transforms[i] = transform;
		// transform.anchor = Vec2.new(0, 0);
	}

	return transforms;
};

const getIndexTransformMapAbsoluteForComputed = (
	indexTransforms: AffineTransform[],
	count: number,
	isComputedByIndex: { [key: string]: boolean },
): { [index: number]: AffineTransform } => {
	let transform: AffineTransform = {
		translate: Vec2.new(0, 0),
		anchor: Vec2.new(0, 0),
		rotation: 0,
		scale: 1,
	};

	const transforms: { [index: number]: AffineTransform } = {
		[0]: {
			translate: Vec2.new(0, 0),
			anchor: indexTransforms[0].anchor,
			rotation: 0,
			scale: 1,
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
				transform.rotation = 1;
				break;
			}
			case PropertyName.Scale: {
				transform.scale = 1;
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
				case PropertyName.Scale: {
					transforms[0].scale = indexTransforms[0].scale;
					break;
				}
			}
		}
	}

	for (let i = 1; i < count; i += 1) {
		transform = applyIndexTransform(indexTransforms[i], transform);
		transforms[i] = transform;

		if (computedKeys.length) {
			transform = {
				anchor: transform.anchor.copy(),
				translate: transform.translate.copy(),
				rotation: transform.rotation,
				scale: transform.scale,
			};

			for (const key of computedKeys) {
				resetKey(key);
			}
		}
	}

	return transforms;
};

export const getIndexTransformMap = (
	transform: AffineTransform,
	indexTransforms: AffineTransform[],
	count: number,
	isComputedByIndex: { [key: number]: boolean },
	behavior: TransformBehavior,
): { [index: number]: AffineTransform } => {
	switch (behavior) {
		case "absolute_for_computed":
			return getIndexTransformMapAbsoluteForComputed(
				indexTransforms,
				count,
				isComputedByIndex,
			);

		case "recursive":
			return getIndexTransformMapRecursive(transform, indexTransforms, count);

		default:
			throw new Error("No transform behavior provided");
	}
};

const defaultTransform: AffineTransform = {
	anchor: Vec2.new(0, 0),
	rotation: 0,
	scale: 1,
	translate: Vec2.new(0, 0),
};

export const computeLayerTransformMap = (
	compositionId: string,
	propertyToValue: PropertyValueMap,
	arrayModifierPropertyToValue: ArrayModifierPropertyValueMap,
	compositionState: CompositionState,
	baseTransform: AffineTransform = defaultTransform,
	options: { recursive: boolean },
): LayerTransformMap => {
	const map: LayerTransformMap = {};

	const composition = compositionState.compositions[compositionId];

	const layerIds = layerParentSort(composition.layers, compositionState);

	for (const layerId of layerIds) {
		const layer = compositionState.layers[layerId];

		map[layer.id] = {
			transform: {},
			indexTransforms: [],
		};

		const arrMods = getLayerArrayModifiers(layerId, compositionState);

		let count = 1;

		if (options.recursive) {
			for (const arrMod of arrMods) {
				const { countId } = arrMod;
				const countValue = propertyToValue[countId].computedValue;
				count *= Math.max(1, countValue);
			}
		}

		for (let i = 0; i < count; i++) {
			let transform = getBaseTransform(layerId, propertyToValue, compositionState);

			if (layer.parentLayerId) {
				const parentTransform = map[layer.parentLayerId].transform[0];
				transform = applyParentTransform(transform, parentTransform, false);
			} else {
				transform = applyParentTransform(transform, baseTransform, true);
			}

			map[layer.id].transform[i] = transform;
		}

		if (options.recursive) {
			for (const arrMod of arrMods) {
				const { countId, transformGroupId, transformBehaviorId } = arrMod;

				const count = Math.max(1, propertyToValue[countId].computedValue);
				const transformBehavior = propertyToValue[transformBehaviorId].computedValue;

				const indexTransform = getLayerArrayModifierIndexTransform(
					compositionState,
					propertyToValue,
					arrayModifierPropertyToValue,
					count,
					baseTransform,
					transformGroupId,
					transformBehavior,
				);
				map[layer.id].indexTransforms.push(indexTransform);
			}
		}
	}

	return map;
};

export const adjustTransformToParent = (
	transform: AffineTransform,
	parentTransform: AffineTransform,
): AffineTransform => {
	const translateDiff = transform.translate.sub(parentTransform.translate);

	const rmat = Mat2.rotation(-parentTransform.rotation);
	const translate = translateDiff
		.multiplyMat2(rmat, parentTransform.anchor)
		.scale(1 / parentTransform.scale, parentTransform.anchor);

	const anchor = transform.anchor;

	const rotation = transform.rotation - parentTransform.rotation;
	const scale = transform.scale / parentTransform.scale;

	return {
		anchor,
		translate,
		rotation,
		scale,
	};
};
