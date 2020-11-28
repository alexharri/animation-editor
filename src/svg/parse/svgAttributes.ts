import { ElementNode } from "svg-parser";
import { DEG_TO_RAD_FAC } from "~/constants";
import { dToPaths } from "~/svg/parse/dToCurves";
import { ParseSvgContext } from "~/svg/parse/parseSvgContext";
import { pointStringToPoints } from "~/svg/parse/polyToPoints";
import {
	matrixAndTranslateFromSvgTransform,
	svgNodeBaseFromTransform,
} from "~/svg/parseSvgTransform";
import { SVGNodeBase } from "~/svg/svgTypes";
import { FillRule, LayerType, LineCap, LineJoin, RGBAColor } from "~/types";
import { getRgbaFromCssColor } from "~/util/color/cssColors";
import { Mat2 } from "~/util/math/mat";

function canRepresentTransform(transformString: string): boolean {
	const tests = ["matrix", "skew", "skewX", "skewY"];
	for (const test of tests) {
		if (transformString.indexOf(test) !== -1) {
			return false;
		}
	}

	return true;
}

const getProperty = <T extends string | number>(
	ctx: ParseSvgContext,
	node: ElementNode,
	name: string,
): T | undefined => {
	const properties = node.properties || {};
	const value = (properties[name] || ctx.computed[name]) as T;
	return value;
};

const createNumberGetter = (name: string) => (
	ctx: ParseSvgContext,
	node: ElementNode,
): number | undefined => {
	let n = getProperty<number>(ctx, node, name);
	if (typeof n === "string") {
		n = parseFloat(n);
	}
	if (typeof n !== "undefined" && typeof n !== "number") {
		n = 0;
	}
	return n;
};

export const svgAttr = {
	position: (ctx: ParseSvgContext, node: ElementNode, layerType: LayerType): Vec2 => {
		const vec = Vec2.new(0, 0);

		let x: number | undefined;
		let y: number | undefined;

		if (layerType === LayerType.Ellipse) {
			x = getProperty<number>(ctx, node, "cx");
			y = getProperty<number>(ctx, node, "cy");
		} else if (layerType === LayerType.Line) {
			x = getProperty<number>(ctx, node, "x1");
			y = getProperty<number>(ctx, node, "y1");
		} else {
			x = getProperty<number>(ctx, node, "x");
			y = getProperty<number>(ctx, node, "y");
		}

		if (typeof x === "number") {
			vec.x = x;
		}
		if (typeof y === "number") {
			vec.y = y;
		}
		return vec;
	},
	width: createNumberGetter("width"),
	height: createNumberGetter("height"),
	radius: createNumberGetter("r"),
	xRadius: createNumberGetter("rx"),
	yRadius: createNumberGetter("ry"),
	p1: (ctx: ParseSvgContext, node: ElementNode): Vec2 => {
		let x1 = getProperty<number>(ctx, node, "x1");
		let y1 = getProperty<number>(ctx, node, "y1");

		if (typeof x1 !== "number" || isNaN(x1)) {
			x1 = 0;
		}
		if (typeof y1 !== "number" || isNaN(y1)) {
			y1 = 0;
		}

		return Vec2.new(x1, y1);
	},
	p2: (ctx: ParseSvgContext, node: ElementNode): Vec2 => {
		let x2 = getProperty<number>(ctx, node, "x2");
		let y2 = getProperty<number>(ctx, node, "y2");

		if (typeof x2 !== "number" || isNaN(x2)) {
			x2 = 0;
		}
		if (typeof y2 !== "number" || isNaN(y2)) {
			y2 = 0;
		}

		return Vec2.new(x2, y2);
	},
	cx: createNumberGetter("cx"),
	cy: createNumberGetter("cy"),
	d: (ctx: ParseSvgContext, node: ElementNode) => {
		const paths = dToPaths(getProperty(ctx, node, "d") || "");
		return paths;
	},
	points: (ctx: ParseSvgContext, node: ElementNode): Vec2[] => {
		const points = getProperty<string>(ctx, node, "points") || "";
		return pointStringToPoints(points);
	},
	fill: (ctx: ParseSvgContext, node: ElementNode): RGBAColor | undefined => {
		const cssFill = getProperty<string>(ctx, node, "fill");
		const fill = getRgbaFromCssColor(cssFill);
		return fill;
	},
	fillOpacity: (ctx: ParseSvgContext, node: ElementNode): number | undefined => {
		const cssFill = getProperty<string>(ctx, node, "fill");
		return cssFill ? 1 : 0;
	},
	strokeColor: (ctx: ParseSvgContext, node: ElementNode): RGBAColor | undefined => {
		const cssStroke = getProperty<string>(ctx, node, "stroke");
		const strokeColor = getRgbaFromCssColor(cssStroke);
		return strokeColor;
	},
	strokeWidth: createNumberGetter("stroke-width"),
	fillRule: (ctx: ParseSvgContext, node: ElementNode): FillRule | undefined => {
		const rule = getProperty<string>(ctx, node, "fill-rule") as FillRule;
		const options: FillRule[] = ["evenodd", "nonzero"];
		if (options.includes(rule)) {
			return rule;
		}
		return undefined;
	},
	lineCap: (ctx: ParseSvgContext, node: ElementNode): LineCap | undefined => {
		const lineCap = getProperty<string>(ctx, node, "stroke-linecap") as LineCap;
		const options: LineCap[] = ["butt", "round", "round"];
		if (options.includes(lineCap)) {
			return lineCap;
		}
		return undefined;
	},
	lineJoin: (ctx: ParseSvgContext, node: ElementNode): LineJoin | undefined => {
		const lineJoin = getProperty<string>(ctx, node, "stroke-linejoin") as LineJoin;
		const options: LineJoin[] = ["round", "miter", "bevel"];
		if (options.includes(lineJoin)) {
			return lineJoin;
		}
		return undefined;
	},
	miterLimit: createNumberGetter("miter-limit"),
	transformString: (ctx: ParseSvgContext, node: ElementNode): string => {
		const transformString = getProperty<string>(ctx, node, "transform");
		return transformString || "";
	},
	transformOriginString: (ctx: ParseSvgContext, node: ElementNode): string => {
		const transformString = getProperty<string>(ctx, node, "transform-origin");
		return transformString || "";
	},
	base: (ctx: ParseSvgContext, node: ElementNode, layerType: LayerType): SVGNodeBase => {
		const position = svgAttr.position(ctx, node, layerType);
		const transformString = getProperty<string>(ctx, node, "transform");
		const transformOriginString = getProperty<string>(ctx, node, "transform-origin");

		if (!transformString || !canRepresentTransform(transformString)) {
			return {
				anchor: Vec2.ORIGIN,
				rotation: 0,
				scale: Vec2.new(1, 1),
				position,
				transform: transformString || "",
				transformOrigin: transformOriginString || "",
			};
		}

		const nodeBase = svgNodeBaseFromTransform(
			position,
			ctx.boundingBox,
			transformString,
			transformOriginString,
		);

		// Place anchor closer to element
		nodeBase.position = nodeBase.position
			.add(nodeBase.anchor.scale(-1))
			.scaleXY(nodeBase.scale.x, nodeBase.scale.y, nodeBase.position)
			.rotate(nodeBase.rotation * DEG_TO_RAD_FAC, nodeBase.position);
		nodeBase.anchor = Vec2.ORIGIN;

		return nodeBase;
	},
	matrixAndPosition: (
		ctx: ParseSvgContext,
		node: ElementNode,
		layerType: LayerType,
	): { matrix: Mat2; translate: Vec2 } => {
		const position = svgAttr.position(ctx, node, layerType);
		const transformString = getProperty<string>(ctx, node, "transform");
		const transformOriginString = getProperty<string>(ctx, node, "transform-origin");

		if (!transformString) {
			return {
				translate: position,
				matrix: Mat2.identity(),
			};
		}

		const result = matrixAndTranslateFromSvgTransform(
			position,
			ctx.boundingBox,
			transformString,
			transformOriginString,
		);

		return result;
	},
};
