import * as mathjs from "mathjs";
import { EvalFunction } from "mathjs";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeType } from "~/flow/flowTypes";
import { CompositionError, CompositionErrorType } from "~/types";

export function getFlowGraphExpressions(
	actionState: ActionState,
	graphId: string,
): { expressions: Record<string, EvalFunction>; errors: CompositionError[] } {
	const { flowState } = actionState;
	const graph = flowState.graphs[graphId];

	const expressions: Record<string, EvalFunction> = {};
	const errors: CompositionError[] = [];

	for (const nodeId of graph.nodes) {
		const node = flowState.nodes[nodeId];

		if (node.type !== FlowNodeType.expr) {
			continue;
		}

		try {
			const { expression } = node.state as FlowNodeState<FlowNodeType.expr>;
			const evalFn = mathjs.compile(expression);
			expressions[node.id] = evalFn;
		} catch (e) {
			errors.push({ type: CompositionErrorType.FlowNode, error: e, graphId, nodeId });
		}
	}

	return { expressions, errors };
}
