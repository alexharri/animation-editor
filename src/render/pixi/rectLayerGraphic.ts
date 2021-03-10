import { RectLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { UpdateGraphicFn } from "~/render/pixi/layerToPixi";
import { PropertyName } from "~/types";
import { hslToRGB, rgbToBinary } from "~/util/color/convertColor";

export const updateRectLayerGraphic: UpdateGraphicFn<RectLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const width = getPropertyValue(map[PropertyName.Width]);
	const height = getPropertyValue(map[PropertyName.Height]);
	const fill = getPropertyValue(map[PropertyName.Fill]);
	const strokeColor = getPropertyValue(map[PropertyName.StrokeColor]);
	const strokeWidth = getPropertyValue(map[PropertyName.StrokeWidth]);
	let borderRadius = getPropertyValue(map[PropertyName.BorderRadius]);

	borderRadius = Math.max(0, Math.min(width / 2 - 0.01, height / 2 - 0.01, borderRadius));

	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineStyle(strokeWidth, rgbToBinary([r, g, b]), a);
	}

	if (borderRadius > 0) {
		graphic.drawRoundedRect(0, 0, width, height, borderRadius);
	} else {
		graphic.drawRect(0, 0, width, height);
	}

	graphic.endFill();

	return graphic;
};

export const updateRectLayerHitTestGraphic: UpdateGraphicFn<RectLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const width = getPropertyValue(map[PropertyName.Width]);
	const height = getPropertyValue(map[PropertyName.Height]);
	const strokeWidth = getPropertyValue(map[PropertyName.StrokeWidth]);
	let borderRadius = getPropertyValue(map[PropertyName.BorderRadius]);

	const X = -strokeWidth / 2;
	const Y = -strokeWidth / 2;
	const W = width + strokeWidth;
	const H = height + strokeWidth;

	if (borderRadius > 0) {
		borderRadius += Math.abs(width - W) / 2;
	}

	graphic.beginFill(rgbToBinary(hslToRGB([300, 80, 76])), 1);

	if (borderRadius > 0) {
		graphic.drawRoundedRect(X, Y, W, H, borderRadius);
	} else {
		graphic.drawRect(X, Y, W, H);
	}

	graphic.endFill();

	return graphic;
};
