import { createFlowCompiledNodes } from "~/flow/flowCompiledNodes";
import { getFlowGraphExpressions } from "~/flow/flowExpressions";
import { getFlowGraphExternals } from "~/flow/flowExternals";
import { getFlowToCompute } from "~/flow/flowToCompute";
import { CompiledFlow } from "~/flow/flowTypes";
import { CompositionError } from "~/types";

export function compileFlowGraph(
	actionState: ActionState,
	graphId: string,
): { flow: CompiledFlow; errors: CompositionError[] } {
	const compiledNodes = createFlowCompiledNodes(actionState, graphId);
	const externals = getFlowGraphExternals(actionState, graphId, compiledNodes);
	const toCompute = getFlowToCompute(actionState, graphId, compiledNodes);
	const { expressions, errors } = getFlowGraphExpressions(actionState, graphId);

	return {
		flow: {
			nodes: compiledNodes,
			externals,
			toCompute,
			expressions,
		},
		errors,
	};
}
