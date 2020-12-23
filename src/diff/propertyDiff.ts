import { diffFactory } from "~/diff/diffFactory";
import { PropertyName } from "~/types";

export const getPropertyDiff = (layerId: string, propertyName: PropertyName) => {
	switch (propertyName) {
		case PropertyName.ScaleX:
		case PropertyName.ScaleY:
		case PropertyName.PositionX:
		case PropertyName.PositionY:
		case PropertyName.AnchorX:
		case PropertyName.AnchorY:
		case PropertyName.Rotation:
			return diffFactory.layerTransform(layerId);
		default:
			return diffFactory.modifyLayer(layerId);
	}
};
