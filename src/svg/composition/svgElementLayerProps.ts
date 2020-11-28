import { ShapeProperties } from "~/composition/layer/shapeLayerProperties";
import { SVGPathNode, SVGPolygonNode, SVGPolylineNode } from "~/svg/svgTypes";

export const svgPathElementLayerProps = (
	node: SVGPathNode | SVGPolygonNode | SVGPolylineNode,
	pathIds: string[],
): Partial<ShapeProperties> => {
	const {
		fill,
		strokeColor,
		strokeWidth,
		fillRule,
		lineCap,
		lineJoin,
		miterLimit,
	} = node.properties;
	const fillOpacity = fill ? fill[3] : 0;

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
