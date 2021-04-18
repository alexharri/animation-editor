import { parse } from "mathjs";

const defaultSymbols = new Set(["pi", "PI"]);

interface AccessorNode {
	type: "AccessorNode";
	object: Node;
	index: IndexNode;
	name: string;
}

interface ArrayNode {
	type: "ArrayNode";
	items: Node[];
}

interface AssignmentNode {
	type: "AssignmentNode";
	object: SymbolNode | AccessorNode;
	index: IndexNode | null;
	value: Node;
	name: string;
}

interface BlockNode {
	type: "BlockNode";
	blocks: Node[];
}

interface ConditionalNode {
	type: "ConditionalNode";
	condition: Node;
	trueExpr: Node;
	falseExpr: Node;
}

interface ConstantNode {
	type: "ConstantNode";
	value: any;
}

/**
 * Disallowed for now
 */
interface FunctionAssignmentNode {
	type: "FunctionAssignmentNode";
}

interface FunctionNode {
	type: "FunctionNode";
	fn: Node | string;
	args: Node[];
}

interface IndexNode {
	type: "IndexNode";
	dimensions: Node[];
	dotNotation: boolean;
}

interface ObjectNode {
	type: "ObjectNode";
	properties: {
		[key: string]: Node;
	};
}

interface OperatorNode {
	type: "OperatorNode";
	op: string;
	fn: string;
	args: Node[];
}

interface ParenthesisNode {
	type: "ParenthesisNode";
	content: Node;
}

interface RangeNode {
	type: "RangeNode";
	start: Node;
	end: Node;
	step: Node | null;
}

interface RelationalNode {
	type: "RelationalNode";
	conditionals: string[];
	params: Node[];
}

interface SymbolNode {
	type: "SymbolNode";
	name: string;
}

type Node =
	| AccessorNode
	| ArrayNode
	| AssignmentNode
	| BlockNode
	| ConditionalNode
	| ConstantNode
	| FunctionAssignmentNode
	| FunctionNode
	| IndexNode
	| ObjectNode
	| OperatorNode
	| ParenthesisNode
	| RangeNode
	| RelationalNode
	| SymbolNode;

export interface ExpressionIO {
	inputs: string[];
	outputs: string[];
}

export const getExpressionIO = (expression: string): [e: Error | null, io: ExpressionIO] => {
	const hasBeenAssigned = new Set<string>();
	const inputs = new Set<string>();
	const outputs = new Set<string>();

	const crawl = (node: Node, _ctx: { assigning?: boolean }) => {
		const { assigning = false } = _ctx;
		const ctx = { assigning };

		switch (node.type) {
			case "AccessorNode": {
				crawl(node.object, ctx);
				if (node.index) {
					crawl(node.index, ctx);
				}
				break;
			}

			case "ArrayNode": {
				for (let i = 0; i < node.items.length; i += 1) {
					crawl(node.items[i], ctx);
				}
				break;
			}

			case "AssignmentNode": {
				crawl(node.value, ctx);
				crawl(node.object, { ...ctx, assigning: true });
				hasBeenAssigned.add(node.name);
				break;
			}

			case "ConditionalNode": {
				crawl(node.condition, ctx);
				crawl(node.trueExpr, ctx);
				crawl(node.falseExpr, ctx);
				break;
			}

			case "ConstantNode": {
				break;
			}

			case "FunctionAssignmentNode": {
				break;
			}

			case "FunctionNode": {
				for (let i = 0; i < node.args.length; i += 1) {
					crawl(node.args[i], ctx);
				}
				break;
			}

			case "IndexNode": {
				for (let i = 0; i < node.dimensions.length; i += 1) {
					crawl(node.dimensions[i], ctx);
				}
				break;
			}

			case "ObjectNode": {
				const keys = Object.keys(node.properties);
				for (let i = 0; i < keys.length; i += 1) {
					crawl(node.properties[keys[i]], ctx);
				}
				break;
			}

			case "OperatorNode": {
				for (let i = 0; i < node.args.length; i += 1) {
					crawl(node.args[i], ctx);
				}
				break;
			}

			case "ParenthesisNode": {
				crawl(node.content, ctx);
				break;
			}

			case "RangeNode": {
				crawl(node.start, ctx);
				crawl(node.end, ctx);
				if (node.step) {
					crawl(node.step, ctx);
				}
				break;
			}

			case "RelationalNode": {
				for (let i = 0; i < node.params.length; i += 1) {
					crawl(node.params[i], ctx);
				}
				break;
			}

			case "SymbolNode": {
				if (ctx.assigning) {
					outputs.add(node.name);
					break;
				}

				if (!hasBeenAssigned.has(node.name) && !defaultSymbols.has(node.name)) {
					inputs.add(node.name);
				}
				break;
			}
		}
	};

	try {
		const res = parse(expression);

		if (res.type === "BlockNode") {
			for (let i = 0; i < (res as any).blocks.length; i += 1) {
				crawl((res as any).blocks[i].node, {});
			}
		} else {
			crawl(res as any, {});
		}

		return [null, { inputs: [...inputs], outputs: [...outputs] }];
	} catch (e) {
		return [e, null!];
	}
};
