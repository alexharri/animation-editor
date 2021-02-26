import { EllipseLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { UpdateGraphicFn } from "~/render/pixi/layerToPixi";
import { PropertyName } from "~/types";
import { rgbToBinary } from "~/util/color/convertColor";

export const updateEllipseLayerGraphic: UpdateGraphicFn<EllipseLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const resolve = (propertyName: PropertyName) => {
		const propertyId = (map as any)[propertyName];
		return getPropertyValue(propertyId);
	};

	const outerRadius = resolve(PropertyName.OuterRadius);
	const fill = resolve(PropertyName.Fill);
	const strokeWidth = resolve(PropertyName.StrokeWidth);
	const strokeColor = resolve(PropertyName.StrokeColor);

	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineTextureStyle({ color: rgbToBinary([r, g, b]), alpha: a, width: strokeWidth });
	}

	graphic.drawEllipse(0, 0, outerRadius, outerRadius);
};
