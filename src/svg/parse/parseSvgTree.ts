import { ElementNode, parse } from "svg-parser";
import { constructParseSvgContext, ParseSvgContext } from "~/svg/parse/parseSvgContext";
import { svgNodeFactory } from "~/svg/parse/svgNodeFactory";
import { pathifySvgNode } from "~/svg/parse/svgPathifyNode";
import { constructSvgStylesheet } from "~/svg/svgStylesheet";
import { SVGNode, SVGNodeBase, SVGSvgNode } from "~/svg/svgTypes";

function canRepresentTransform(transformString: string): boolean {
	const tests = ["matrix", "skew", "skewX", "skewY"];
	for (const test of tests) {
		if (transformString.indexOf(test) !== -1) {
			return false;
		}
	}

	return true;
}

const svgNodeBase: SVGNodeBase = {
	transform: "",
	transformOrigin: "",
	position: Vec2.ORIGIN,
	anchor: Vec2.ORIGIN,
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

interface Options {
	toPathify: Array<SVGNode["tagName"]>;
}

export const constructSvgTree = (svg: string, options: Options): SVGSvgNode => {
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
		toPathify: options.toPathify,
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

	return pathify(svgNode, options.toPathify);
};

function pathify(svg: SVGSvgNode, toPathify: Array<SVGNode["tagName"]>): SVGSvgNode {
	function parse(node: SVGNode): SVGNode {
		if (toPathify.includes(node.tagName) || !canRepresentTransform(node.transform)) {
			return pathifySvgNode[node.tagName](node);
		}

		switch (node.tagName) {
			case "g": {
				return {
					...node,
					children: node.children.map(parse),
				};
			}
		}

		return node;
	}

	return {
		...svg,
		children: svg.children.map(parse),
	};
}
