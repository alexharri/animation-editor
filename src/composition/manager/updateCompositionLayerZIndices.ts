import { Composition } from "~/composition/compositionTypes";
import { LayerManager } from "~/composition/layer/LayerManager";

export const updateLayerZIndices = (composition: Composition, registry: LayerManager) => {
	for (let i = 0; i < composition.layers.length; i++) {
		const layerId = composition.layers[i];
		const container = registry.getLayerTransformContainer(layerId);
		container.zIndex = composition.layers.length - i;
	}
};
