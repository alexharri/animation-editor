import { CompiledFlow } from "~/flow/flowTypes";

function getPropertyIdsThatAffectFlow(compiledFlow: CompiledFlow): string[] {
	return Object.keys(compiledFlow.externals.propertyValue);
}

export function getLayerFlowGraphOrder(layerGraphIds: string[], compiledFlows: CompiledFlow[]) {
	const propertyIdToAffectedFlow: Record<string, string[]> = {};

	for (const [i, graphId] of layerGraphIds.entries()) {
		const propertyIds = getPropertyIdsThatAffectFlow(compiledFlows[i]);
		for (const propertyId of propertyIds) {
			if (!propertyIdToAffectedFlow[propertyId]) {
				propertyIdToAffectedFlow[propertyId] = [];
			}
			propertyIdToAffectedFlow[propertyId].push(graphId);
		}
	}

	const toPrev: Record<string, string[]> = {};

	for (const graphId of layerGraphIds) {
		toPrev[graphId] = [];
	}

	for (const [i, graphId] of layerGraphIds.entries()) {
		const compiledFlow = compiledFlows[i];
		for (const compiledNode of compiledFlow.toCompute) {
			for (const propertyId of compiledNode.affectedExternals.propertyIds) {
				compiledNode.affectedExternals.propertyIds;

				if (propertyIdToAffectedFlow[propertyId]) {
					for (const affectedFlow of propertyIdToAffectedFlow[propertyId]) {
						toPrev[affectedFlow].push(graphId);
					}
				}
			}
		}
	}

	const toCompute: string[] = [];

	const visited = new Set<string>();
	function dfs(graphId: string, visitedInTrip: Set<string>) {
		if (visited.has(graphId)) {
			if (visitedInTrip.has(graphId)) {
				// The graph was visited twice in one trip. Circular dependency.
				throw new Error(`Circular graph dependency at '${graphId}'`);
			}
			// This node has been visited globally, but not in this trip. No work to be done.
			return;
		}

		visited.add(graphId);
		visitedInTrip.add(graphId);

		const nextGraphIds = toPrev[graphId];
		for (const nextGraphId of nextGraphIds) {
			dfs(nextGraphId, visitedInTrip);
		}

		toCompute.push(graphId);
	}

	for (const graphId of layerGraphIds) {
		dfs(graphId, new Set());
	}

	return toCompute;
}
