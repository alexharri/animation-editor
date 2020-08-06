import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import {
	getLayerArrayModifierCountPropertyId,
	getLayerArrayModifierTransform,
	getLayerCompositionProperties,
} from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { layerParentSort } from "~/shared/layer/layerParentSort";
import { AffineTransform, PropertyName, PropertyValueMap } from "~/types";
import { rotateVec2CCW } from "~/util/math";

interface LayerTransformMap {
	[layerId: string]: {
		transform: { [index: number]: AffineTransform };
		indexTransform: AffineTransform | null;
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
	_transform: AffineTransform,
	parentTransform: AffineTransform,
	isBaseTransform: boolean,
): AffineTransform => {
	const transform = { ..._transform };

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
	return transform;
};

export const applyIndexTransform = (
	_transform: AffineTransform,
	indexTransform: AffineTransform,
	index: number,
): AffineTransform => {
	let transform = { ..._transform };

	const count = Math.abs(index);
	for (let i = 0; i < count; i += 1) {
		transform = applyParentTransform(indexTransform, transform, true);
	}

	return transform;
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

		map[layer.id] = {
			transform: {},
			indexTransform: null,
		};

		let count = 1;

		const countPropertyId = getLayerArrayModifierCountPropertyId(layerId, compositionState);
		if (countPropertyId) {
			count = propertyToValue[countPropertyId].computedValue[0];
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

		if (countPropertyId) {
			const indexTransform = getLayerArrayModifierTransform(layerId, compositionState)!;
			map[layer.id].indexTransform = indexTransform;
		}
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
