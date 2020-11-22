import { ElementNode } from "svg-parser";
import { parseStyleString } from "~/svg/svgStylesheet";
import { SvgStyles, SvgStylesheet } from "~/svg/svgTypes";

export interface ParseSvgContext {
	stylesheet: SvgStylesheet;
	boundingBox: [width: number, height: number];
	computed: SvgStyles;
}

export const constructParseSvgContext = (
	parentContext: ParseSvgContext,
	node: ElementNode,
): ParseSvgContext => {
	const { style = "" } = (node.properties || {}) as { style?: string };

	let computed: SvgStyles = { ...parentContext.computed };

	const properties = node.properties || {};
	const classNames = (properties.class || "")
		.toString()
		.split(/[ ]+/)
		.map((str) => str.trim())
		.filter(Boolean);

	for (const className of classNames) {
		const classSelector = "." + className;
		const attrs = parentContext.stylesheet[classSelector];
		computed = { ...computed, ...attrs };
	}

	const nodeStyles = parseStyleString(style);

	computed = { ...computed, ...nodeStyles };

	return {
		boundingBox: parentContext.boundingBox,
		stylesheet: parentContext.stylesheet,
		computed,
	};
};
