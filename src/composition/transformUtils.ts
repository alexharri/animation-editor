import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { layerParentSort } from "~/shared/layer/layerParentSort";
import { AffineTransform, PropertyName, PropertyValueMap } from "~/types";
import { rotateVec2CCW } from "~/util/math";

interface LayerTransformMap {
	[layerId: string]: AffineTransform;
}

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
		const value = propertyToValue[p.id] ?? p.value;
		(obj as any)[PropertyName[p.name]] = value.computedValue ?? p.value;
		return obj;
	}, {} as any);

	return {
		anchor: Vec2.new(props.AnchorX, props.AnchorY),
		rotation: props.Rotation * DEG_TO_RAD_FAC,
		scale: props.Scale,
		translate: Vec2.new(props.PositionX, props.PositionY),
	};
};

/**
 * Modifies the `transform`
 */
const applyParentTransform = (
	transform: AffineTransform,
	parentTransform: AffineTransform,
	isBaseTransform: boolean,
) => {
	transform.translate = transform.translate.add(parentTransform.translate);

	if (isBaseTransform) {
		transform.translate = transform.translate.sub(parentTransform.anchor);
	}

	transform.translate = rotateVec2CCW(
		transform.translate,
		parentTransform.rotation,
		parentTransform.translate,
	);
	transform.translate = transform.translate.scale(
		parentTransform.scale,
		parentTransform.translate,
	);
	transform.rotation += parentTransform.rotation;
	transform.scale = transform.scale * parentTransform.scale;
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
): LayerTransformMap => {
	const map: LayerTransformMap = {};

	const composition = compositionState.compositions[compositionId];

	const layerIds = layerParentSort(composition.layers, compositionState);

	for (const layerId of layerIds) {
		const layer = compositionState.layers[layerId];

		const transform = getBaseTransform(layerId, propertyToValue, compositionState);

		if (layer.parentLayerId) {
			const parentTransform = map[layer.parentLayerId];
			applyParentTransform(transform, parentTransform, false);
		} else {
			applyParentTransform(transform, baseTransform, true);
		}

		map[layer.id] = transform;
	}

	return map;
};

export const adjustTransformToParent = (
	transform: AffineTransform,
	parentTransform: AffineTransform,
): AffineTransform => {
	const translateDiff = transform.translate.sub(parentTransform.translate);

	const anchor = transform.anchor;
	const translate = rotateVec2CCW(
		translateDiff,
		-parentTransform.rotation,
		parentTransform.anchor,
	).scale(1 / parentTransform.scale, parentTransform.anchor);
	const rotation = transform.rotation - parentTransform.rotation;
	const scale = transform.scale / parentTransform.scale;

	return {
		anchor,
		translate,
		rotation,
		scale,
	};
};
