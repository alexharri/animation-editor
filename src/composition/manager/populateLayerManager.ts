import { LayerManager } from "~/composition/manager/layerManager";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";
import { layerParentSort } from "~/shared/layer/layerParentSort";

export const populateLayerManager = (
	compositionId: string,
	layerManager: LayerManager,
	actionState: ActionState,
) => {
	const { compositionState } = actionState;

	const composition = compositionState.compositions[compositionId];

	const layerIds = layerParentSort(composition.layers, compositionState);

	for (let i = 0; i < layerIds.length; i++) {
		const layerId = layerIds[i];
		const layer = compositionState.layers[layerId];
		layerManager.addLayer(layer, actionState);
	}

	updateLayerZIndices(composition, layerManager);
};
