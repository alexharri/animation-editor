import { Composition } from "~/composition/compositionTypes";
import { LayerManager } from "~/composition/manager/layerManager";

export const updateLayerZIndices = (composition: Composition, registry: LayerManager) => {
	for (let i = 0; i < composition.layers.length; i++) {
		const layerId = composition.layers[i];
		const container = registry.getLayerContainer(layerId);
		container.zIndex = composition.layers.length - i;
	}
};
