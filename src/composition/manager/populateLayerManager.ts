import { LayerManager } from "~/composition/manager/layer/LayerManager";
import { layerParentSort } from "~/shared/layer/layerParentSort";

export const populateLayerManager = (actionState: ActionState, layerManager: LayerManager) => {
	const { compositionState } = actionState;

	const composition = compositionState.compositions[layerManager.compositionId];

	const layerIds = layerParentSort(composition.layers, compositionState);
	for (const layerId of layerIds) {
		layerManager.addLayer(actionState, layerId);
	}

	layerManager.updateLayerZIndices(actionState);
};
