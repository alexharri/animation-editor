import { CompositionState } from "~/composition/compositionReducer";
import { CompositionProperty } from "~/composition/compositionTypes";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { LayerTransform, ParentIndexTransform, PropertyName, PropertyValueMap } from "~/types";
import { rotateVec2CCW } from "~/util/math";
import { Mat2 } from "~/util/math/mat";

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
		scaleX: props.ScaleX,
		scaleY: props.ScaleY,
	};
};

export const getLayerBaseTransform = (
	layerId: string,
	propertyToValue: PropertyValueMap,
	compositionState: CompositionState,
): LayerTransform => {
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
		scaleX: props.ScaleX,
		scaleY: props.ScaleY,
		translate: Vec2.new(props.PositionX, props.PositionY),
		matrix: Mat2.identity()
			.scaleXY(props.ScaleX, props.ScaleY)
			.rotate(props.Rotation * DEG_TO_RAD_FAC),
	};
};

export const applyParentIndexTransform = (
	t: LayerTransform,
	parentIndexTransform: ParentIndexTransform,
): LayerTransform => {
	const { indexTransform, baseTransform } = parentIndexTransform;

	const translate = t.translate
		.multiplyMat2(indexTransform.matrix, baseTransform.translate)
		.add(indexTransform.translate.multiplyMat2(baseTransform.matrix));

	return {
		translate,
		anchor: t.anchor,
		rotation: t.rotation + indexTransform.rotation,
		scaleX: t.scaleX * indexTransform.scaleX,
		scaleY: t.scaleY * indexTransform.scaleY,
		matrix: t.matrix.multiplyMat2(indexTransform.matrix),
	};
};

export const applyCompositionTransform = (
	t: LayerTransform,
	compositionTransform: { origin: Vec2; transform: LayerTransform },
): LayerTransform => {
	const { transform: ct, origin } = compositionTransform;

	let translate = t.translate;

	translate = translate
		.multiplyMat2(ct.matrix, origin)
		.add(ct.translate.rotate(ct.rotation).scaleXY(ct.scaleX, ct.scaleY));

	return {
		translate,
		anchor: t.anchor,
		rotation: t.rotation + ct.rotation,
		scaleX: t.scaleX * ct.scaleX,
		scaleY: t.scaleY * ct.scaleY,
		matrix: t.matrix.multiplyMat2(ct.matrix),
	};
};

export const applyParentTransform = (
	transform: LayerTransform,
	parentTransform: LayerTransform,
	isBaseTransform: boolean,
): LayerTransform => {
	let translate = transform.translate;

	translate = translate.add(parentTransform.translate);

	if (isBaseTransform) {
		translate = translate.sub(parentTransform.anchor);
	}

	if (parentTransform.scaleX !== 1 || parentTransform.scaleY !== 1) {
		translate = translate.scaleXY(
			parentTransform.scaleX,
			parentTransform.scaleY,
			parentTransform.translate,
		);
	}

	if (parentTransform.rotation !== 0) {
		translate = rotateVec2CCW(translate, parentTransform.rotation, parentTransform.translate);
	}

	return {
		translate,
		anchor: transform.anchor,
		rotation: transform.rotation + parentTransform.rotation,
		scaleX: transform.scaleX * parentTransform.scaleX,
		scaleY: transform.scaleY * parentTransform.scaleY,
		matrix: transform.matrix.multiplyMat2(parentTransform.matrix),
	};
};

export const adjustTransformToParent = (
	transform: LayerTransform,
	parentTransform: LayerTransform,
): LayerTransform => {
	const translateDiff = transform.translate.sub(parentTransform.translate);

	const rmat = Mat2.rotation(-parentTransform.rotation);
	const translate = translateDiff
		.multiplyMat2(rmat, parentTransform.anchor)
		.scaleXY(1 / parentTransform.scaleX, 1 / parentTransform.scaleY, parentTransform.anchor);

	const anchor = transform.anchor;

	const rotation = transform.rotation - parentTransform.rotation;
	const scaleX = transform.scaleX / parentTransform.scaleX;
	const scaleY = transform.scaleY / parentTransform.scaleY;

	return {
		anchor,
		translate,
		rotation: rotation,
		scaleX: scaleX,
		scaleY: scaleY,
		matrix: Mat2.identity(),
	};
};
