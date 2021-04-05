import { CompositionState } from "~/composition/compositionReducer";
import { forEachSubProperty } from "~/composition/compositionUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { LayerTransform, LayerType, PropertyGroupName, PropertyName } from "~/types";
import { Mat2 } from "~/util/math/mat";

export const getLayerTransform = (
	layerId: string,
	compositionState: CompositionState,
	getPropertyValue: (propertyId: string) => any,
): LayerTransform => {
	const layer = compositionState.layers[layerId];
	for (const propertyId of layer.properties) {
		const group = compositionState.properties[propertyId];
		if (group.name === PropertyGroupName.Transform) {
			return getTransformFromTransformGroupId(group.id, compositionState, getPropertyValue);
		}
	}
	throw new Error(`Layer '${layerId}' has no transform group.`);
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

export const getPropertyIdsFromTransformGroupId = (
	transformGroupId: string,
	compositionState: CompositionState,
) => {
	let positionX!: string;
	let positionY!: string;
	let anchorX!: string;
	let anchorY!: string;
	let scaleX!: string;
	let scaleY!: string;
	let rotation!: string;

	forEachSubProperty(transformGroupId, compositionState, (property) => {
		switch (property.name) {
			case PropertyName.PositionX: {
				positionX = property.id;
				break;
			}
			case PropertyName.PositionY: {
				positionY = property.id;
				break;
			}
			case PropertyName.AnchorX: {
				anchorX = property.id;
				break;
			}
			case PropertyName.AnchorY: {
				anchorY = property.id;
				break;
			}
			case PropertyName.ScaleX: {
				scaleX = property.id;
				break;
			}
			case PropertyName.ScaleY: {
				scaleY = property.id;
				break;
			}
			case PropertyName.Rotation: {
				rotation = property.id;
				break;
			}
		}
	});

	return { positionX, positionY, anchorX, anchorY, scaleX, scaleY, rotation };
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

export const getRotationCorrectedPosition = (
	layerType: LayerType,
	positionX: number,
	positionY: number,
	scaleX: number,
	scaleY: number,
	rotation: number,
	rotationCorrection: number,
	dimensions: [width: number, height: number],
): [x: number, y: number] => {
	const position = Vec2.new(positionX, positionY);

	if (layerType === LayerType.Ellipse) {
		const p = position.rotate(rotationCorrection * 0.5 * rotation);
		return [p.x, p.y];
	}

	const [width, height] = dimensions;

	const scaleDelta = Vec2.new(width, height)
		.sub(Vec2.new(width, height).scaleXY(scaleX, scaleY))
		.scale(0.5);

	const atRot = position.sub(Vec2.new(width, height)).scale(0.5).add(Vec2.new(width, height));

	const diff = position.sub(atRot).add(scaleDelta);
	const dr = diff.rotate(rotation);
	const sum = atRot.add(dr);

	const p = position.lerp(sum, rotationCorrection);
	return [p.x, p.y];
};
