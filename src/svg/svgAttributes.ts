import { ElementNode } from "svg-parser";
import { DEFAULT_LAYER_TRANSFORM, DEG_TO_RAD_FAC } from "~/constants";
import {
	layerTransformFromSvgTransform,
	matrixAndTranslateFromSvgTransform,
} from "~/svg/parseSvgTransform";
import { SvgContext } from "~/svg/svgContext";
import { FillRule, LayerTransform, LayerType, LineCap, LineJoin, RGBAColor } from "~/types";
import { getRgbaFromCssColor } from "~/util/color/cssColors";
import { Mat2 } from "~/util/math/mat";

export const createSvgAttrGetter = (ctx: SvgContext) => {
	const getProperty = <T extends string | number>(
		node: ElementNode,
		name: string,
	): T | undefined => {
		const properties = node.properties || {};
		let value = properties[name] as T;

		const classNames = (properties.class || "").toString().split(/[ ]+/).filter(Boolean);

		for (const className of classNames) {
			const classSelector = "." + className;
			const attrs = ctx.stylesheet[classSelector];
			if (attrs && attrs[name]) {
				value = attrs[name] as T;
			}
		}

		return value;
	};

	const createNumberGetter = (name: string) => (node: ElementNode): number | undefined => {
		let n = getProperty<number>(node, name);
		if (typeof n === "string") {
			n = parseFloat(n);
		}
		if (typeof n !== "undefined" && typeof n !== "number") {
			n = 0;
		}
		return n;
	};

	const getAttr = {
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
		fill: (node: ElementNode): RGBAColor | undefined => {
			const cssFill = getProperty<string>(node, "fill");
			const fill = getRgbaFromCssColor(cssFill);
			return fill;
		},
		fillOpacity: (node: ElementNode): number | undefined => {
			const cssFill = getProperty<string>(node, "fill");
			return cssFill ? 1 : 0;
		},
		strokeColor: (node: ElementNode): RGBAColor | undefined => {
			const cssStroke = getProperty<string>(node, "stroke");
			const strokeColor = getRgbaFromCssColor(cssStroke);
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
			const lineCap = getProperty<string>(node, "stroke-linecap") as LineCap;
			const options: LineCap[] = ["butt", "round", "round"];
			if (options.includes(lineCap)) {
				return lineCap;
			}
			return undefined;
		},
		lineJoin: (node: ElementNode): LineJoin | undefined => {
			const lineJoin = getProperty<string>(node, "stroke-linejoin") as LineJoin;
			const options: LineJoin[] = ["round", "miter", "bevel"];
			if (options.includes(lineJoin)) {
				return lineJoin;
			}
			return undefined;
		},
		miterLimit: createNumberGetter("miter-limit"),
		transformString: (node: ElementNode): string => {
			const transformString = getProperty<string>(node, "transform");
			return transformString || "";
		},
		transform: (node: ElementNode, layerType: LayerType): LayerTransform => {
			const position = getAttr.position(node, layerType);
			const transformString = getProperty<string>(node, "transform");
			const transformOriginString = getProperty<string>(node, "transform-origin");

			if (!transformString) {
				return {
					...DEFAULT_LAYER_TRANSFORM,
					translate: position,
				};
			}

			const transform = layerTransformFromSvgTransform(
				position,
				ctx.boundingBox,
				transformString,
				transformOriginString,
			);

			// Place anchor closer to element

			transform.translate = transform.translate
				.add(transform.anchor.scale(-1))
				.scaleXY(transform.scaleX, transform.scaleY, transform.translate)
				.rotate(transform.rotation * DEG_TO_RAD_FAC, transform.translate);
			transform.anchor = Vec2.ORIGIN;

			return transform;
		},
		matrixAndPosition: (
			node: ElementNode,
			layerType: LayerType,
		): { matrix: Mat2; translate: Vec2 } => {
			const position = getAttr.position(node, layerType);
			const transformString = getProperty<string>(node, "transform");
			const transformOriginString = getProperty<string>(node, "transform-origin");

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
	return getAttr;
};
