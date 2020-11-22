import { ElementNode } from "svg-parser";
import { ShapeProperties } from "~/composition/layer/shapeLayerProperties";
import { SvgContext } from "~/svg/svgContext";

export const svgPathElementLayerProps = (
	ctx: SvgContext,
	node: ElementNode,
	pathIds: string[],
): Partial<ShapeProperties> => {
	const fill = ctx.attr.fill(node);
	const fillOpacity = ctx.attr.fillOpacity(node);
	const strokeColor = ctx.attr.strokeColor(node);
	const fillRule = ctx.attr.fillRule(node);
	const lineCap = ctx.attr.lineCap(node);
	const lineJoin = ctx.attr.lineJoin(node);
	const miterLimit = ctx.attr.miterLimit(node);
	const strokeWidth = ctx.attr.strokeWidth(node);

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
