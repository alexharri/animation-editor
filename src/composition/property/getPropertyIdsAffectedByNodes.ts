import { CompiledFlow, CompiledFlowNode } from "~/flow/flowTypes";

export function getPropertyIdsPotentiallyAffectedByNodes(
	flow: CompiledFlow,
	nodeIds: string[],
): string[] {
	const visited = new Set<string>();
	const propertyIdSet = new Set<string>();

	function dfs(node: CompiledFlowNode) {
		if (visited.has(node.id)) {
			return;
		}
		visited.add(node.id);

		for (const nextNode of node.next) {
			dfs(nextNode);
		}

		const propertyIds = node.affectedExternals.potentialPropertyIds;
		propertyIds.forEach((propertyId) => propertyIdSet.add(propertyId));

		for (const propertyId of propertyIds) {
			if (flow.externals.propertyValue[propertyId]) {
				for (const node of flow.externals.propertyValue[propertyId]) {
					dfs(node);
				}
			}
		}
	}
	for (const nodeId of nodeIds) {
		dfs(flow.nodes[nodeId]);
	}
	return [...propertyIdSet];
}
