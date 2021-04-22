import { CompiledFlowNode, FlowNode } from "~/flow/flowTypes";

export function getFlowToCompute(
	actionState: ActionState,
	graphId: string,
	compiledNodes: Record<string, CompiledFlowNode>,
): CompiledFlowNode[] {
	const { flowState } = actionState;

	const toCompute: string[] = [];
	const visited = new Set<string>();

	function dfs(node: FlowNode, visitedInTrip: Set<string>) {
		if (visited.has(node.id)) {
			if (visitedInTrip.has(node.id)) {
				// The node was visited twice in one trip.
				//
				// Circular dependency.
				throw new Error(`Circular node dependency at '${node.id}'`);
			}

			// This node has been visited globally, but not in this trip.
			//
			// No work to be done.
			return;
		}

		visited.add(node.id);
		visitedInTrip.add(node.id);

		for (const input of node.inputs) {
			if (!input.pointer) {
				continue;
			}

			const nextNode = flowState.nodes[input.pointer.nodeId];
			dfs(nextNode, new Set(visitedInTrip));
		}

		toCompute.push(node.id);
	}

	const graph = flowState.graphs[graphId];
	for (const nodeId of graph.nodes) {
		dfs(flowState.nodes[nodeId], new Set());
	}

	return toCompute.map((nodeId) => compiledNodes[nodeId]);
}
