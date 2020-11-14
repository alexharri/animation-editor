import { ElementNode } from "svg-parser";
import { ShapeProperties } from "~/composition/layer/shapeLayerProperties";
import { getSvgAttr } from "~/svg/svgAttributes";

export const svgPathElementLayerProps = (
	node: ElementNode,
	pathIds: string[],
): Partial<ShapeProperties> => {
	const fill = getSvgAttr.fill(node);
	const fillOpacity = getSvgAttr.fillOpacity(node);
	const strokeColor = getSvgAttr.strokeColor(node);
	const fillRule = getSvgAttr.fillRule(node);
	const lineCap = getSvgAttr.lineCap(node);
	const lineJoin = getSvgAttr.lineJoin(node);
	const miterLimit = getSvgAttr.miterLimit(node);
	const strokeWidth = getSvgAttr.strokeWidth(node);

	return {
		shapes: [
			{
				pathIds,
				fill,
				fillOpacity,
				fillRule,
				lineCap,
				lineJoin,
				miterLimit,
				strokeColor,
				strokeWidth,
			},
		],
	};
};
