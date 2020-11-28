import { ElementNode } from "svg-parser";
import { constructParseSvgContext, ParseSvgContext } from "~/svg/parse/parseSvgContext";
import { svgAttr } from "~/svg/parse/svgAttributes";
import {
	SVGCircleNode,
	SVGEllipseNode,
	SVGGNode,
	SVGLineNode,
	SVGNode,
	SVGPathNode,
	SVGPolygonNode,
	SVGPolylineNode,
	SVGRectNode,
} from "~/svg/svgTypes";
import { LayerType } from "~/types";
import { getDistance } from "~/util/math";

function getBasicShapeProperties(ctx: ParseSvgContext, node: ElementNode) {
	const fill = svgAttr.fill(ctx, node) || [0, 0, 0, 0];
	const strokeColor = svgAttr.strokeColor(ctx, node) || [0, 0, 0, 0];
	const strokeWidth = svgAttr.strokeWidth(ctx, node) ?? 0;
	return { fill, strokeColor, strokeWidth };
}

function line(ctx: ParseSvgContext, node: ElementNode): SVGLineNode {
	const p1 = svgAttr.p1(ctx, node);
	const p2 = svgAttr.p2(ctx, node);
	const length = getDistance(p1, p2);
	const line: Line = [p1, p2];
	const strokeColor = svgAttr.strokeColor(ctx, node);
	const strokeWidth = svgAttr.strokeWidth(ctx, node);
	const lineCap = svgAttr.lineCap(ctx, node);
	return {
		tagName: "line",
		...svgAttr.base(ctx, node, LayerType.Rect),
		properties: { length, line, strokeColor, strokeWidth, lineCap },
	};
}

function rect(ctx: ParseSvgContext, node: ElementNode): SVGRectNode {
	const width = svgAttr.width(ctx, node) ?? 0;
	const height = svgAttr.height(ctx, node) ?? 0;
	const lineJoin = svgAttr.lineJoin(ctx, node);
	return {
		tagName: "rect",
		...svgAttr.base(ctx, node, LayerType.Rect),
		properties: {
			...getBasicShapeProperties(ctx, node),
			lineJoin,
			width,
			height,
		},
	};
}

function circle(ctx: ParseSvgContext, node: ElementNode): SVGCircleNode {
	const radius = svgAttr.radius(ctx, node) ?? 0;

	if (!getBasicShapeProperties(ctx, node).fill) {
		console.log("aaah", node);
	}

	return {
		tagName: "circle",
		...svgAttr.base(ctx, node, LayerType.Ellipse),
		properties: { ...getBasicShapeProperties(ctx, node), radius },
	};
}

function ellipse(ctx: ParseSvgContext, node: ElementNode): SVGEllipseNode {
	const xRadius = svgAttr.xRadius(ctx, node) ?? 0;
	const yRadius = svgAttr.yRadius(ctx, node) ?? 0;
	return {
		tagName: "ellipse",
		...svgAttr.base(ctx, node, LayerType.Ellipse),
		properties: { ...getBasicShapeProperties(ctx, node), radius: Vec2.new(xRadius, yRadius) },
	};
}

function path(ctx: ParseSvgContext, node: ElementNode): SVGPathNode {
	const d = svgAttr.d(ctx, node);
	const fillRule = svgAttr.fillRule(ctx, node);
	const lineCap = svgAttr.lineCap(ctx, node);
	const lineJoin = svgAttr.lineJoin(ctx, node);
	const miterLimit = svgAttr.miterLimit(ctx, node);
	return {
		tagName: "path",
		...svgAttr.base(ctx, node, LayerType.Shape),
		properties: {
			...getBasicShapeProperties(ctx, node),
			d,
			fillRule,
			lineCap,
			lineJoin,
			miterLimit,
		},
	};
}

function polygon(ctx: ParseSvgContext, node: ElementNode): SVGPolygonNode {
	const points = svgAttr.points(ctx, node);
	const fillRule = svgAttr.fillRule(ctx, node);
	const lineCap = svgAttr.lineCap(ctx, node);
	const lineJoin = svgAttr.lineJoin(ctx, node);
	const miterLimit = svgAttr.miterLimit(ctx, node);
	return {
		tagName: "polygon",
		...svgAttr.base(ctx, node, LayerType.Rect),
		properties: {
			...getBasicShapeProperties(ctx, node),
			points,
			fillRule,
			lineCap,
			lineJoin,
			miterLimit,
		},
	};
}

function polyline(ctx: ParseSvgContext, node: ElementNode): SVGPolylineNode {
	const points = svgAttr.points(ctx, node);
	const fillRule = svgAttr.fillRule(ctx, node);
	const lineCap = svgAttr.lineCap(ctx, node);
	const lineJoin = svgAttr.lineJoin(ctx, node);
	const miterLimit = svgAttr.miterLimit(ctx, node);
	return {
		tagName: "polyline",
		...svgAttr.base(ctx, node, LayerType.Rect),
		properties: {
			...getBasicShapeProperties(ctx, node),
			points,
			fillRule,
			lineCap,
			lineJoin,
			miterLimit,
		},
	};
}

function g(ctx: ParseSvgContext, node: ElementNode): SVGGNode {
	const children: SVGNode[] = [];

	for (const child of [...node.children].reverse()) {
		if (typeof child === "string" || child.type === "text") {
			continue;
		}

		const { tagName = "" } = child;

		if (svgNodeFactory[tagName]) {
			const childCtx = constructParseSvgContext(ctx, child);
			const node = svgNodeFactory[tagName](childCtx, child);
			if (!node) {
				continue;
			}
			children.push(node);
		}
	}

	return {
		tagName: "g",
		...svgAttr.base(ctx, node, LayerType.Rect),
		properties: {},
		children,
	};
}

export const svgNodeFactory: Record<
	string,
	(ctx: ParseSvgContext, node: ElementNode) => SVGNode
> = {
	line,
	rect,
	circle,
	ellipse,
	path,
	polygon,
	polyline,
	g,
};
