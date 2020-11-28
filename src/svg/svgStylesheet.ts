import { Declaration, parse, Rule, Stylesheet } from "css";
import { ElementNode } from "svg-parser";
import { SvgStylesheet } from "~/svg/svgTypes";

const parseStylesheet = (svgStylesheet: SvgStylesheet, s: Stylesheet) => {
	if (!s.stylesheet) {
		return;
	}

	const rules = s.stylesheet.rules.filter((rule: Rule): rule is Required<Rule> => {
		return !!(rule.selectors && rule.declarations);
	});

	for (const rule of rules) {
		for (const selector of rule.selectors) {
			if (!svgStylesheet[selector]) {
				svgStylesheet[selector] = {};
			}

			const declarations = rule.declarations.filter((decl: Declaration): decl is Required<
				Declaration
			> => {
				return decl.type === "declaration";
			});

			for (const decl of declarations) {
				svgStylesheet[selector][decl.property] = decl.value;
			}
		}
	}
};

export function parseStyleString(style: string) {
	const svgStylesheet: SvgStylesheet = {};
	const parsed = parse(`.x{${style}}`);
	parseStylesheet(svgStylesheet, parsed);
	return svgStylesheet[".x"];
}

export function constructSvgStylesheet(svgNode: ElementNode): SvgStylesheet {
	const svgStylesheet: SvgStylesheet = {};

	function find(node: ElementNode) {
		if (node.tagName === "style") {
			const [child] = node.children;

			if (typeof child === "string") {
				parseStylesheet(svgStylesheet, parse(child));
			} else if (child.type === "text" && child.value) {
				parseStylesheet(svgStylesheet, parse(child.value as string));
			}

			return;
		}

		if (!node.children) {
			return;
		}

		for (const child of node.children) {
			if (typeof child === "string" || child.type !== "element") {
				continue;
			}

			find(child);
		}
	}

	find(svgNode);

	return svgStylesheet;
}
