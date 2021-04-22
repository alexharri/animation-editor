import { createFlowCompiledNodes } from "~/flow/flowCompiledNodes";
import { getFlowGraphExpressions } from "~/flow/flowExpressions";
import { getFlowGraphExternals } from "~/flow/flowExternals";
import { getFlowToCompute } from "~/flow/flowToCompute";
import { CompiledFlow } from "~/flow/flowTypes";

export function compileFlowGraph(actionState: ActionState, graphId: string): CompiledFlow {
	const compiledNodes = createFlowCompiledNodes(actionState, graphId);
	const externals = getFlowGraphExternals(actionState, graphId, compiledNodes);
	const toCompute = getFlowToCompute(actionState, graphId, compiledNodes);
	const expressions = getFlowGraphExpressions(actionState, graphId);

	return {
		nodes: compiledNodes,
		externals,
		toCompute,
		expressions,
	};
}
