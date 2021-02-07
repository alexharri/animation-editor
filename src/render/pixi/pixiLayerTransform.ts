import { Layer } from "~/composition/compositionTypes";
import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { DEG_TO_RAD_FAC } from "~/constants";
import { PropertyName } from "~/types";

interface Options {
	transformContainer: PIXI.Container;
	map: LayerPropertyMap;
	getPropertyValue: (propertyId: string) => any;
	layer: Layer;
}

const createResolver = (options: Options) => (propertyName: PropertyName) => {
	const propertyId = (options.map as any)[propertyName];
	return options.getPropertyValue(propertyId);
};

export const applyPixiLayerTransform = (options: Options) => {
	const resolve = createResolver(options);

	// Apply the layer's transform to the transform container
	const positionX = resolve(PropertyName.PositionX);
	const positionY = resolve(PropertyName.PositionY);
	const anchorX = resolve(PropertyName.AnchorX);
	const anchorY = resolve(PropertyName.AnchorY);
	const scaleX = resolve(PropertyName.ScaleX);
	const scaleY = resolve(PropertyName.ScaleY);
	const rotation = resolve(PropertyName.Rotation);

	options.transformContainer.scale.set(scaleX, scaleY);
	options.transformContainer.rotation = rotation * DEG_TO_RAD_FAC;
	options.transformContainer.position.set(positionX, positionY);
	options.transformContainer.pivot.set(anchorX, anchorY);
};
