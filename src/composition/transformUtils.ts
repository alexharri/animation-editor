import { CompositionState } from "~/composition/compositionReducer";
import { Property } from "~/composition/compositionTypes";
import { forEachSubProperty } from "~/composition/compositionUtils";
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
		{ [key in keyof typeof PropertyName]: Property }
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
		origin: Vec2.ORIGIN,
		originBehavior: "relative",
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
		.sub(indexTransform.anchor)
		.multiplyMat2(indexTransform.matrix, baseTransform.translate)
		.add(indexTransform.translate.multiplyMat2(baseTransform.matrix));

	return {
		origin: t.origin,
		originBehavior: t.originBehavior,
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
		origin: t.origin,
		originBehavior: t.originBehavior,
		translate,
		anchor: t.anchor,
		rotation: t.rotation + ct.rotation,
		scaleX: t.scaleX * ct.scaleX,
		scaleY: t.scaleY * ct.scaleY,
		matrix: t.matrix.multiplyMat2(ct.matrix),
	};
};

export const applyIndexTransformToLayer = (
	transform: LayerTransform,
	indexTransform: LayerTransform,
): LayerTransform => {
	let translate = indexTransform.translate.add(transform.translate);

	const origin = transform.translate;
	translate = translate.sub(transform.anchor);
	translate = translate.scaleXY(transform.scaleX, transform.scaleY, origin);
	translate = rotateVec2CCW(translate, transform.rotation, origin);

	return {
		origin: indexTransform.origin,
		originBehavior: indexTransform.originBehavior,
		translate,
		anchor: indexTransform.anchor,
		rotation: transform.rotation + indexTransform.rotation,
		scaleX: transform.scaleX * indexTransform.scaleX,
		scaleY: transform.scaleY * indexTransform.scaleY,
		matrix: transform.matrix.multiplyMat2(indexTransform.matrix),
	};
};

export const applyParentTransform = (
	transform: LayerTransform,
	parentTransform: LayerTransform,
): LayerTransform => {
	let translate = transform.translate.add(parentTransform.translate).sub(parentTransform.anchor);

	const origin = parentTransform.translate;

	if (parentTransform.scaleX !== 1 || parentTransform.scaleY !== 1) {
		translate = translate.scaleXY(parentTransform.scaleX, parentTransform.scaleY, origin);
	}

	if (parentTransform.rotation !== 0) {
		translate = rotateVec2CCW(translate, parentTransform.rotation, origin);
	}

	return {
		origin: transform.origin,
		originBehavior: transform.originBehavior,
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
	const translateDiff = transform.translate
		.sub(parentTransform.translate)
		.add(parentTransform.anchor);

	const rmat = Mat2.rotation(-parentTransform.rotation);
	const translate = translateDiff
		.multiplyMat2(rmat, parentTransform.anchor)
		.scaleXY(1 / parentTransform.scaleX, 1 / parentTransform.scaleY, parentTransform.anchor);

	const anchor = transform.anchor;

	const rotation = transform.rotation - parentTransform.rotation;
	const scaleX = transform.scaleX / parentTransform.scaleX;
	const scaleY = transform.scaleY / parentTransform.scaleY;

	return {
		origin: transform.origin,
		originBehavior: transform.originBehavior,
		anchor,
		translate,
		rotation: rotation,
		scaleX: scaleX,
		scaleY: scaleY,
		matrix: Mat2.identity(),
	};
};

export const getTransformFromTransformGroupId = (
	transformGroupId: string,
	compositionState: CompositionState,
	getPropertyValue: (propertyId: string) => any,
): LayerTransform => {
	const transform: LayerTransform = {
		anchor: Vec2.new(0, 0),
		translate: Vec2.new(0, 0),
		rotation: 0,
		scaleX: 0,
		scaleY: 0,
		matrix: Mat2.identity(),
		origin: Vec2.new(0, 0),
		originBehavior: "relative",
	};

	forEachSubProperty(transformGroupId, compositionState, (property) => {
		switch (property.name) {
			case PropertyName.PositionX: {
				transform.translate.x = getPropertyValue(property.id);
				break;
			}
			case PropertyName.PositionY: {
				transform.translate.y = getPropertyValue(property.id);
				break;
			}
			case PropertyName.AnchorX: {
				transform.anchor.x = getPropertyValue(property.id);
				break;
			}
			case PropertyName.AnchorY: {
				transform.anchor.y = getPropertyValue(property.id);
				break;
			}
			case PropertyName.ScaleX: {
				transform.scaleX = getPropertyValue(property.id);
				break;
			}
			case PropertyName.ScaleY: {
				transform.scaleY = getPropertyValue(property.id);
				break;
			}
			case PropertyName.Rotation: {
				transform.rotation = getPropertyValue(property.id) * DEG_TO_RAD_FAC;
				break;
			}
		}
	});

	return transform;
};

export const applyIndexTransformRotationCorrection = (
	indexTransform: LayerTransform,
	rotationCorrection: number,
	dimensions: [width: number, height: number],
) => {
	const [width, height] = dimensions;

	const origin =
		indexTransform.originBehavior === "relative" ? indexTransform.origin : Vec2.ORIGIN;

	const scaleDelta = Vec2.new(width, height)
		.sub(Vec2.new(width, height).scaleXY(indexTransform.scaleX, indexTransform.scaleY))
		.scale(0.5);

	const atRot = indexTransform.translate
		.sub(Vec2.new(width, height))
		.scale(0.5)
		.add(Vec2.new(width, height));

	const diff = indexTransform.translate.sub(atRot).add(scaleDelta);
	const dr = diff.rotate(indexTransform.rotation, origin);
	const sum = atRot.add(dr);

	return {
		...indexTransform,
		translate: indexTransform.translate.lerp(sum, rotationCorrection),
	};
};
