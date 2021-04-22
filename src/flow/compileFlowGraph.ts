import { createFlowCompiledNodes } from "~/flow/flowCompiledNodes";
import { getFlowGraphExternals } from "~/flow/flowExternals";
import { getFlowToCompute } from "~/flow/flowToCompute";
import { CompiledFlowGraph } from "~/flow/flowTypes";

export function compileFlowGraph(actionState: ActionState, graphId: string): CompiledFlowGraph {
	const compiledNodes = createFlowCompiledNodes(actionState, graphId);
	const externals = getFlowGraphExternals(actionState, graphId, compiledNodes);
	const toCompute = getFlowToCompute(actionState, graphId, compiledNodes);

	return {
		nodes: compiledNodes,
		externals,
		toCompute,
	};
}
