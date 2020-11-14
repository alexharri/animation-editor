import { ElementNode } from "svg-parser";
import { DEFAULT_LAYER_TRANSFORM } from "~/constants";
import { parseSvgTransform } from "~/svg/parseSvgTransform";
import { FillRule, LayerTransform, LayerType, LineCap, LineJoin, RGBColor } from "~/types";
import { hexToRGB } from "~/util/color/convertColor";
import { getHexFromCssColor } from "~/util/color/cssColors";

const getProperty = <T extends string | number>(node: ElementNode, name: string): T | undefined => {
	return (node.properties || {})[name] as T;
};

const createNumberGetter = (name: string) => (node: ElementNode): number | undefined => {
	let n = getProperty<number>(node, name);
	if (typeof n !== "undefined" && typeof n !== "number") {
		n = 0;
	}
	return n;
};

export const getSvgAttr = {
	position: (node: ElementNode, layerType: LayerType): Vec2 => {
		const vec = Vec2.new(0, 0);

		let x: number | undefined;
		let y: number | undefined;

		if (layerType === LayerType.Ellipse) {
			x = getProperty<number>(node, "cx");
			y = getProperty<number>(node, "cy");
		} else {
			x = getProperty<number>(node, "x");
			y = getProperty<number>(node, "y");
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
	cx: createNumberGetter("cx"),
	cy: createNumberGetter("cy"),
	d: (node: ElementNode): string | undefined => getProperty(node, "d"),
	points: (node: ElementNode): string | undefined => getProperty(node, "points"),
	fill: (node: ElementNode): RGBColor | undefined => {
		const cssFill = getProperty<string>(node, "fill");
		const fill = cssFill ? hexToRGB(getHexFromCssColor(cssFill)) : undefined;
		return fill;
	},
	fillOpacity: (node: ElementNode): number | undefined => {
		const cssFill = getProperty<string>(node, "fill");
		return cssFill ? 1 : 0;
	},
	strokeColor: (node: ElementNode): RGBColor | undefined => {
		const cssStroke = getProperty<string>(node, "stroke");
		const strokeColor = cssStroke ? hexToRGB(getHexFromCssColor(cssStroke)) : undefined;
		return strokeColor;
	},
	strokeWidth: createNumberGetter("stroke-width"),
	fillRule: (node: ElementNode): FillRule | undefined => {
		const rule = getProperty<string>(node, "fill-rule") as FillRule;
		const options: FillRule[] = ["evenodd", "nonzero"];
		if (options.includes(rule)) {
			return rule;
		}
		return undefined;
	},
	lineCap: (node: ElementNode): LineCap | undefined => {
		const lineCap = getProperty<string>(node, "line-cap") as LineCap;
		const options: LineCap[] = ["butt", "round", "round"];
		if (options.includes(lineCap)) {
			return lineCap;
		}
		return undefined;
	},
	lineJoin: (node: ElementNode): LineJoin | undefined => {
		const lineJoin = getProperty<string>(node, "line-join") as LineJoin;
		const options: LineJoin[] = ["round", "miter", "bevel"];
		if (options.includes(lineJoin)) {
			return lineJoin;
		}
		return undefined;
	},
	miterLimit: createNumberGetter("miter-limit"),
	transform: (node: ElementNode, layerType: LayerType): LayerTransform => {
		const position = getSvgAttr.position(node, layerType);
		const transformString = getProperty<string>(node, "transform");

		if (!transformString) {
			return {
				...DEFAULT_LAYER_TRANSFORM,
				translate: position,
			};
		}

		const transform = parseSvgTransform(position, transformString);
		return transform;
	},
};
