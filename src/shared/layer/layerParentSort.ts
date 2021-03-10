import { CompositionState } from "~/composition/compositionReducer";

/**
 * Returns the layerIds topologically sorted. Layers with no parents first.
 *
 * Does not consider circular references.
 */
export const layerParentSort = (
	layerIds: string[],
	compositionState: CompositionState,
): string[] => {
	const visited = new Set<string>();
	const stack: string[] = [];

	function dfs(layerId: string) {
		const layer = compositionState.layers[layerId];

		if (visited.has(layer.id)) {
			return;
		}

		visited.add(layer.id);

		if (layer.parentLayerId) {
			dfs(layer.parentLayerId);
		}

		stack.push(layer.id);
	}

	for (const layerId of layerIds) {
		dfs(layerId);
	}

	return stack;
};

export const getLayerChildLayers = (
	targetLayerId: string,
	compositionState: CompositionState,
): string[] => {
	const targetLayer = compositionState.layers[targetLayerId];
	const composition = compositionState.compositions[targetLayer.compositionId];

	const visitedToIsChild: Record<string, boolean> = {};
	const visited = new Set<string>();
	const childLayerIds: string[] = [];

	function dfs(layerId: string) {
		if (visited.has(layerId)) {
			return;
		}
		const layer = compositionState.layers[layerId];
		visited.add(layerId);

		if (layer.parentLayerId === targetLayerId) {
			childLayerIds.push(layerId);
			visitedToIsChild[layer.id] = true;
			return;
		}

		if (!layer.parentLayerId) {
			return;
		}

		if (!visited.has(layer.parentLayerId)) {
			dfs(layer.parentLayerId);
		}

		visitedToIsChild[layer.id] = visitedToIsChild[layer.parentLayerId];

		if (visitedToIsChild[layer.parentLayerId]) {
			childLayerIds.push(layer.id);
		}
	}

	for (const layerId of composition.layers) {
		dfs(layerId);
	}

	return childLayerIds;
};
