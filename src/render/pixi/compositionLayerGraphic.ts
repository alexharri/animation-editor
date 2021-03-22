import { CompositionLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { UpdateGraphicFn } from "~/render/pixi/layerToPixi";
import { PropertyName } from "~/types";
import { hslToRGB, rgbToBinary } from "~/util/color/convertColor";

export const updateCompositionLayerHitTestGraphic: UpdateGraphicFn<CompositionLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const width = getPropertyValue(map[PropertyName.Width]);
	const height = getPropertyValue(map[PropertyName.Height]);

	graphic.beginFill(rgbToBinary(hslToRGB([300, 80, 76])), 1);

	graphic.drawRect(0, 0, width, height);

	graphic.endFill();

	return graphic;
};
