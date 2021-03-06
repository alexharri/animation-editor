import * as PIXI from "pixi.js";
import { constructLayerPropertyMap, LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
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
	options: { applyAnchor: boolean } = { applyAnchor: true },
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
		options.applyAnchor ? anchorX : 0,
		options.applyAnchor ? anchorY : 0,
		scaleX,
		scaleY,
		rotation * DEG_TO_RAD_FAC,
		0,
		0,
	);

	return matrix;
};

export const getRealPixiLayerMatrix = (
	actionState: ActionState,
	layerId: string,
	getPropertyValue: (propertyId: string) => any,
) => {
	const matrices: PIXI.Matrix[] = [];

	const { compositionState } = actionState;

	let curr = compositionState.layers[layerId];

	while (curr.parentLayerId) {
		const next = compositionState.layers[curr.parentLayerId];
		matrices.push(
			getPixiLayerMatrix(
				constructLayerPropertyMap(next.id, compositionState),
				getPropertyValue,
				{ applyAnchor: true },
			),
		);
		curr = next;
	}

	const matrix = new PIXI.Matrix();

	for (const parentMatrix of matrices) {
		matrix.append(parentMatrix);
	}
	matrix.append(
		getPixiLayerMatrix(constructLayerPropertyMap(layerId, compositionState), getPropertyValue, {
			applyAnchor: true,
		}),
	);

	return matrix;
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
