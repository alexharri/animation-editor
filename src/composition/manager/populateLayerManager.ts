import { LayerManager } from "~/composition/layer/LayerManager";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";
import { layerParentSort } from "~/shared/layer/layerParentSort";

export const populateLayerManager = (actionState: ActionState, layerManager: LayerManager) => {
	const { compositionState } = actionState;

	const composition = compositionState.compositions[layerManager.compositionId];

	const layerIds = layerParentSort(composition.layers, compositionState);
	for (const layerId of layerIds) {
		layerManager.addLayer(actionState, layerId);
	}

	updateLayerZIndices(composition, layerManager);
};
