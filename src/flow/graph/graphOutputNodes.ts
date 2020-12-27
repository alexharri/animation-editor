import { FlowGraph, FlowNode, FlowNodeType } from "~/flow/flowTypes";

export const findGraphOutputNodes = (
	graph: FlowGraph,
): FlowNode<FlowNodeType.property_output>[] => {
	const nodeIds = Object.keys(graph.nodes);

	const outputNodes: FlowNode<FlowNodeType.property_output>[] = [];
	for (const nodeId of nodeIds) {
		const node = graph.nodes[nodeId];
		if (node.type === FlowNodeType.property_output) {
			outputNodes.push(node as FlowNode<FlowNodeType.property_output>);
		}
	}

	return outputNodes;
};
