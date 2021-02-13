import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeType } from "~/flow/flowTypes";
import { getFlowPropertyNodeReferencedPropertyIds } from "~/flow/flowUtils";

export function getPropertyIdsAffectedByNodes(
	actionState: ActionState,
	nodeIdsThatEmitFrameIndex: string[],
	nodeToNext: Record<string, string[]>,
): string[] {
	const found = new Set<string>();
	const propertyIdSet = new Set<string>();

	function dfs(nodeId: string) {
		if (found.has(nodeId)) {
			return;
		}
		found.add(nodeId);
		const next = nodeToNext[nodeId];
		for (const nodeId of next) {
			dfs(nodeId);
		}

		const node = actionState.flowState.nodes[nodeId];
		if (node.type === FlowNodeType.property_output) {
			const state = node.state as FlowNodeState<FlowNodeType.property_output>;
			const propertyIds = getFlowPropertyNodeReferencedPropertyIds(
				actionState.compositionState,
				state.propertyId,
			);
			propertyIds.forEach((propertyId) => propertyIdSet.add(propertyId));
		}
	}
	for (const nodeId of nodeIdsThatEmitFrameIndex) {
		dfs(nodeId);
	}
	return [...propertyIdSet];
}
