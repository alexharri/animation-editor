import { FlowGraph, FlowNode, FlowNodeType } from "~/flow/flowTypes";

export function getGraphNodesInTopologicalOrder(
	outputNodes: FlowNode<FlowNodeType.property_output>[],
	graph: FlowGraph,
): string[] {
	const visitedNodes = new Set<string>();
	const toCompute: string[] = [];

	function dfs(node: FlowNode<any>) {
		if (visitedNodes.has(node.id)) {
			return;
		}

		visitedNodes.add(node.id);

		for (const input of node.inputs) {
			if (input.pointer) {
				dfs(graph.nodes[input.pointer.nodeId]);
			}
		}

		toCompute.push(node.id);
	}

	for (const outputNode of outputNodes) {
		dfs(outputNode);
	}

	return toCompute;
}
