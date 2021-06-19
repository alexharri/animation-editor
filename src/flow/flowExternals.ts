import { getArrayModifierInfo } from "~/composition/util/compositionPropertyUtils";
import { FlowNodeState } from "~/flow/flowNodeState";
import { CompiledFlowNode, FlowGraphExternals, FlowNodeType } from "~/flow/flowTypes";
import { getFlowPropertyNodeReferencedPropertyIds } from "~/flow/flowUtils";

export function getFlowGraphExternals(
	actionState: ActionState,
	graphId: string,
	compiledNodes: Record<string, CompiledFlowNode>,
): FlowGraphExternals {
	const { flowState, compositionState } = actionState;
	const graph = flowState.graphs[graphId];

	const externals: FlowGraphExternals = {
		arrayModifierCount: {},
		arrayModifierIndex: [],
		frameIndex: [],
		propertyValue: {},
	};

	for (const nodeId of graph.nodes) {
		if (graph.type === "array_modifier_graph") {
			const { propertyId } = graph;
			const { countId } = getArrayModifierInfo(propertyId, compositionState);
			externals.arrayModifierCount[countId] = graph.nodes.map(
				(nodeId) => compiledNodes[nodeId],
			);
		}

		const compiledNode = compiledNodes[nodeId];
		const node = flowState.nodes[nodeId];

		switch (node.type) {
			case FlowNodeType.array_modifier_index:
				externals.arrayModifierIndex.push(compiledNode);
				break;
			case FlowNodeType.composition:
				externals.frameIndex.push(compiledNode);
				break;
			case FlowNodeType.property_input: {
				const state = node.state as FlowNodeState<FlowNodeType.property_input>;
				const propertyIds = getFlowPropertyNodeReferencedPropertyIds(
					compositionState,
					state.propertyId,
				);
				for (const propertyId of propertyIds) {
					if (!externals.propertyValue[propertyId]) {
						externals.propertyValue[propertyId] = [];
					}
					externals.propertyValue[propertyId].push(compiledNode);
				}
				break;
			}
		}
	}

	return externals;
}
