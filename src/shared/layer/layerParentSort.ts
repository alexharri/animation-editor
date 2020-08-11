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
