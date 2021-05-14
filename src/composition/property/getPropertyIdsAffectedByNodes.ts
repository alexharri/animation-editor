import { CompiledFlowNode } from "~/flow/flowTypes";

export function getPropertyIdsPotentiallyAffectedByNodes(nodes: CompiledFlowNode[]): string[] {
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
	}
	for (const node of nodes) {
		dfs(node);
	}
	return [...propertyIdSet];
}
