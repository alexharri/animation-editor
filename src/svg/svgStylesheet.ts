import { Declaration, parse, Rule, Stylesheet } from "css";
import { ElementNode } from "svg-parser";
import { SvgStylesheet } from "~/svg/svgTypes";

export function constructSvgStylesheet(svgNode: ElementNode): SvgStylesheet {
	const svgStylesheet: SvgStylesheet = {};

	const parseStylesheet = ({ stylesheet }: Stylesheet) => {
		if (!stylesheet) {
			return;
		}

		const rules = stylesheet.rules.filter((rule: Rule): rule is Required<Rule> => {
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

	function find(node: ElementNode) {
		if (node.tagName === "style") {
			const [child] = node.children;

			if (typeof child === "string") {
				parseStylesheet(parse(child));
			} else if (child.type === "text" && child.value) {
				parseStylesheet(parse(child.value as string));
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
