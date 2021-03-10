import { EllipseLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { UpdateGraphicFn } from "~/render/pixi/layerToPixi";
import { PropertyName } from "~/types";
import { hslToRGB, rgbToBinary } from "~/util/color/convertColor";

export const updateEllipseLayerGraphic: UpdateGraphicFn<EllipseLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const outerRadius = getPropertyValue(map[PropertyName.OuterRadius]);
	const fill = getPropertyValue(map[PropertyName.Fill]);
	const strokeWidth = getPropertyValue(map[PropertyName.StrokeWidth]);
	const strokeColor = getPropertyValue(map[PropertyName.StrokeColor]);

	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineTextureStyle({ color: rgbToBinary([r, g, b]), alpha: a, width: strokeWidth });
	}

	graphic.drawEllipse(0, 0, outerRadius, outerRadius);
};

export const updateEllipseHitTestLayerGraphic: UpdateGraphicFn<EllipseLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const outerRadius = getPropertyValue(map[PropertyName.OuterRadius]);
	const strokeWidth = getPropertyValue(map[PropertyName.StrokeWidth]);

	graphic.beginFill(rgbToBinary(hslToRGB([300, 80, 76])), 1);

	const R = outerRadius + strokeWidth / 2;
	graphic.drawEllipse(0, 0, R, R);
};
