import { RectLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { UpdateGraphicFn } from "~/render/pixi/layerToPixi";
import { PropertyName } from "~/types";
import { rgbToBinary } from "~/util/color/convertColor";

export const updateRectLayerGraphic: UpdateGraphicFn<RectLayerPropertyMap> = (
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

	const width = resolve(PropertyName.Width);
	const height = resolve(PropertyName.Height);
	const fill = resolve(PropertyName.Fill);
	const strokeColor = resolve(PropertyName.StrokeColor);
	const strokeWidth = resolve(PropertyName.StrokeWidth);
	let borderRadius = resolve(PropertyName.BorderRadius);

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
