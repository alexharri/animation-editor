import * as mathjs from "mathjs";
import { EvalFunction } from "mathjs";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeType } from "~/flow/flowTypes";

export function getFlowGraphExpressions(
	actionState: ActionState,
	graphId: string,
): Record<string, EvalFunction> {
	const { flowState } = actionState;
	const graph = flowState.graphs[graphId];

	const expressions: Record<string, EvalFunction> = {};

	for (const nodeId of graph.nodes) {
		const node = flowState.nodes[nodeId];

		if (node.type !== FlowNodeType.expr) {
			continue;
		}

		const { expression } = node.state as FlowNodeState<FlowNodeType.expr>;
		const evalFn = mathjs.compile(expression);
		expressions[node.id] = evalFn;
	}

	return expressions;
}
