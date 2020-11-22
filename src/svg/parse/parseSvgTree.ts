import { ElementNode, parse } from "svg-parser";
import { constructParseSvgContext, ParseSvgContext } from "~/svg/parse/parseSvgContext";
import { svgNodeFactory } from "~/svg/parse/svgNodeFactory";
import { constructSvgStylesheet } from "~/svg/svgStylesheet";
import { SVGNode, SVGSvgNode } from "~/svg/svgTypes";

const svgNodeBase = {
	anchor: Vec2.ORIGIN,
	position: Vec2.ORIGIN,
	rotation: 0,
	scale: Vec2.new(1, 1),
};

function parseChild(parentContext: ParseSvgContext, node: ElementNode): SVGNode | null {
	const { tagName = "" } = node;

	if (svgNodeFactory[tagName]) {
		const ctx = constructParseSvgContext(parentContext, node);
		return svgNodeFactory[tagName](ctx, node);
	}

	return null;
}

export const constructSvgTree = (svg: string): SVGSvgNode => {
	const parsed = parse(svg);

	const node = parsed.children[0];

	if (!node || node.type !== "element" || node.tagName !== "svg") {
		throw new Error("Expected root to have an svg child.");
	}

	const { width = 100, height = 100 } = (node.properties || {}) as Partial<{
		width: number;
		height: number;
	}>;

	const parentCtx: ParseSvgContext = {
		boundingBox: [width, height],
		stylesheet: constructSvgStylesheet(node),
		computed: {},
	};

	const svgNode: SVGSvgNode = {
		tagName: "svg",
		...svgNodeBase,
		properties: { width, height },
		children: node.children
			.map((child) => {
				if (typeof child === "string" || child.type === "text") {
					return null;
				}
				return parseChild(parentCtx, child);
			})
			.filter((node): node is SVGNode => Boolean(node)),
	};
	return svgNode;
};
