import { getFlowNodeAffectedExternals } from "~/flow/flowAffectedExternals";
import { CompiledFlowNode, FlowNode } from "~/flow/flowTypes";

export function createFlowCompiledNodes(actionState: ActionState, graphId: string) {
	const { flowState } = actionState;

	const graph = flowState.graphs[graphId];

	const compiledNodes = graph.nodes.reduce<Record<string, CompiledFlowNode>>((obj, nodeId) => {
		const node = flowState.nodes[nodeId];
		const compiledNode: CompiledFlowNode = {
			id: node.id,
			next: [],
			affectedExternals: getFlowNodeAffectedExternals(actionState, node),
		};
		obj[nodeId] = compiledNode;

		return obj;
	}, {});

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

			const compiledNode = compiledNodes[input.pointer.nodeId];
			compiledNode.next.push({ nodeId: node.id });

			const nextNode = flowState.nodes[input.pointer.nodeId];
			dfs(nextNode, new Set(visitedInTrip));
		}
	}

	for (const nodeId of graph.nodes) {
		dfs(flowState.nodes[nodeId], new Set());
	}

	return compiledNodes;
}
