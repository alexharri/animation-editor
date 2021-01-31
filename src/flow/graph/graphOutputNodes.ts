import { FlowGraph, FlowNode, FlowNodeType } from "~/flow/flowTypes";
import { FlowState } from "~/flow/state/flowReducers";

export const findGraphOutputNodes = (
	graph: FlowGraph,
	flowState: FlowState,
): FlowNode<FlowNodeType.property_output>[] => {
	const nodeIds = graph.nodes;

	const outputNodes: FlowNode<FlowNodeType.property_output>[] = [];
	for (const nodeId of nodeIds) {
		const node = flowState.nodes[nodeId];
		if (node.type === FlowNodeType.property_output) {
			outputNodes.push(node as FlowNode<FlowNodeType.property_output>);
		}
	}

	return outputNodes;
};
