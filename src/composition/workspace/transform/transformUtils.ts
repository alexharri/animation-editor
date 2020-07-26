import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { layerParentSort } from "~/shared/layer/layerParentSort";
import { AffineTransform, PropertyName } from "~/types";
import { rotateVec2CCW } from "~/util/math";

interface LayerTransformMap {
	[layerId: string]: AffineTransform;
}

interface ValueMap {
	[propertyId: string]: {
		computedValue: any;
		rawValue: any;
	};
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
	propertyToValue: ValueMap,
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
const applyParentTransform = (transform: AffineTransform, parentTransform: AffineTransform) => {
	transform.translate = transform.translate.add(parentTransform.translate);
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

export const computeLayerTransformMap = (
	compositionId: string,
	propertyToValue: ValueMap,
	compositionState: CompositionState,
): LayerTransformMap => {
	const map: LayerTransformMap = {};

	const composition = compositionState.compositions[compositionId];

	const layerIds = layerParentSort(composition.layers, compositionState);

	for (const layerId of layerIds) {
		const layer = compositionState.layers[layerId];

		const transform = getBaseTransform(layerId, propertyToValue, compositionState);

		if (layer.parentLayerId) {
			const parentTransform = map[layer.parentLayerId];
			applyParentTransform(transform, parentTransform);
		}

		map[layer.id] = transform;
	}

	return map;
};
