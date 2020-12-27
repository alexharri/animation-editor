import { FlowGraph } from "~/flow/flowTypes";
import { findGraphOutputNodes } from "~/flow/graph/graphOutputNodes";
import { getGraphNodesInTopologicalOrder } from "~/flow/graph/graphTopologicalSort";

interface UpstreamNode {
	nodeId: string;
	inputIndex: number;
}

export const getGraphNodeToUpstreamNodes = (graph: FlowGraph): Record<string, UpstreamNode[]> => {
	const map: Record<string, UpstreamNode[]> = {};

	const outputNodes = findGraphOutputNodes(graph);
	const inTopologicalOrder = getGraphNodesInTopologicalOrder(outputNodes, graph);

	for (const nodeId of inTopologicalOrder) {
		map[nodeId] = [];
	}

	for (const nodeId of inTopologicalOrder) {
		const node = graph.nodes[nodeId];
		for (let i = 0; i < node.inputs.length; i++) {
			const input = node.inputs[i];
			if (!input.pointer) {
				continue;
			}

			map[input.pointer.nodeId].push({ nodeId, inputIndex: i });
		}
	}

	return map;
};
