import { LayerManager } from "~/composition/manager/layerManager";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";

export const populateCompositionContainer = (
	state: ActionState,
	compositionId: string,
	registry: LayerManager,
) => {
	const composition = state.compositionState.compositions[compositionId];

	for (let i = 0; i < composition.layers.length; i++) {
		const layerId = composition.layers[i];
		const layer = state.compositionState.layers[layerId];
		registry.addLayer(layer, state);
	}

	updateLayerZIndices(composition, registry);
};
