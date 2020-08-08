import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import {
	getLayerArrayModifierIndexTransform,
	getLayerArrayModifiers,
	getLayerCompositionProperties,
} from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { layerParentSort } from "~/shared/layer/layerParentSort";
import { AffineTransform, PropertyName, PropertyValueMap } from "~/types";
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
	index: number,
): AffineTransform => {
	const props = getLayerCompositionProperties(layerId, compositionState).reduce<
		{ [key in keyof typeof PropertyName]: any }
	>((obj, p) => {
		const value = propertyToValue[p.id];
		(obj as any)[PropertyName[p.name]] = value.computedValue[index] ?? value.computedValue[0];
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

export const _applyIndexTransform = (
	indexTransform: AffineTransform,
	transform: AffineTransform,
): AffineTransform => {
	let translate = indexTransform.translate;

	translate = translate.add(transform.translate);

	if (transform.rotation !== 0) {
		translate = rotateVec2CCW(translate, transform.rotation, transform.translate);
	}
	if (transform.scale !== 1) {
		translate = translate.scale(transform.scale, transform.translate);
	}

	return {
		translate,
		anchor: transform.anchor.add(indexTransform.anchor),
		rotation: indexTransform.rotation + transform.rotation,
		scale: indexTransform.scale * transform.scale,
	};
};

/**
 * This is done extremely inefficiently. This should be cached 100%
 */
export const applyIndexTransform = (
	_transform: AffineTransform,
	indexTransform: AffineTransform,
	index: number,
): AffineTransform => {
	let transform = { ..._transform };

	const count = Math.abs(index);
	for (let i = 0; i < count; i += 1) {
		transform = _applyIndexTransform(indexTransform, transform);
	}

	return transform;
};

export const getIndexTransformMap = (
	indexTransform: AffineTransform,
	count: number,
): { [index: number]: AffineTransform } => {
	let transform: AffineTransform = {
		translate: Vec2.new(0, 0),
		anchor: Vec2.new(0, 0),
		rotation: 0,
		scale: 1,
	};

	const transforms: { [index: number]: AffineTransform } = {
		[0]: transform,
	};

	for (let i = 1; i < count; i += 1) {
		transform = _applyIndexTransform(indexTransform, transform);
		transforms[i] = transform;
	}

	return transforms;
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
				const countValue = propertyToValue[countId].computedValue[0];
				count *= Math.max(1, countValue);
			}
		}

		for (let i = 0; i < count; i++) {
			let transform = getBaseTransform(layerId, propertyToValue, compositionState, i);

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
				const { countId, transformGroupId } = arrMod;
				const count = Math.max(1, propertyToValue[countId].computedValue[0]);
				const indexTransform = getLayerArrayModifierIndexTransform(
					compositionState,
					propertyToValue,
					count,
					transformGroupId,
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
