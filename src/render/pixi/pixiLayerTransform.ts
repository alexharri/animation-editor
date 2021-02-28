import * as PIXI from "pixi.js";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { DEG_TO_RAD_FAC } from "~/constants";
import { PropertyName } from "~/types";

const createResolver = (map: LayerPropertyMap, getPropertyValue: (propertyId: string) => any) => (
	propertyName: PropertyName,
) => {
	const propertyId = (map as any)[propertyName];
	return getPropertyValue(propertyId);
};

export const getPixiLayerMatrix = (
	map: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
): PIXI.Matrix => {
	const resolve = createResolver(map, getPropertyValue);

	const positionX = resolve(PropertyName.PositionX);
	const positionY = resolve(PropertyName.PositionY);
	const anchorX = resolve(PropertyName.AnchorX);
	const anchorY = resolve(PropertyName.AnchorY);
	const scaleX = resolve(PropertyName.ScaleX);
	const scaleY = resolve(PropertyName.ScaleY);
	const rotation = resolve(PropertyName.Rotation);

	const matrix = new PIXI.Matrix();
	matrix.setTransform(
		positionX,
		positionY,
		anchorX,
		anchorY,
		scaleX,
		scaleY,
		rotation * DEG_TO_RAD_FAC,
		0,
		0,
	);

	return matrix;
};

export const getPixiLayerTransform = (
	map: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
): PIXI.Transform => {
	const resolve = createResolver(map, getPropertyValue);

	const positionX = resolve(PropertyName.PositionX);
	const positionY = resolve(PropertyName.PositionY);
	const anchorX = resolve(PropertyName.AnchorX);
	const anchorY = resolve(PropertyName.AnchorY);
	const scaleX = resolve(PropertyName.ScaleX);
	const scaleY = resolve(PropertyName.ScaleY);
	const rotation = resolve(PropertyName.Rotation);

	const transform = new PIXI.Transform();
	transform.scale.set(scaleX, scaleY);
	transform.rotation = rotation * DEG_TO_RAD_FAC;
	transform.position.set(positionX, positionY);
	transform.pivot.set(anchorX, anchorY);
	return transform;
};

export const applyPixiLayerTransform = (
	transformContainer: PIXI.Container,
	map: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
) => {
	const resolve = createResolver(map, getPropertyValue);

	// Apply the layer's transform to the transform container
	const positionX = resolve(PropertyName.PositionX);
	const positionY = resolve(PropertyName.PositionY);
	const anchorX = resolve(PropertyName.AnchorX);
	const anchorY = resolve(PropertyName.AnchorY);
	const scaleX = resolve(PropertyName.ScaleX);
	const scaleY = resolve(PropertyName.ScaleY);
	const rotation = resolve(PropertyName.Rotation);

	transformContainer.scale.set(scaleX, scaleY);
	transformContainer.rotation = rotation * DEG_TO_RAD_FAC;
	transformContainer.position.set(positionX, positionY);
	transformContainer.pivot.set(anchorX, anchorY);
};
