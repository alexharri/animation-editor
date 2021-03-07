import { createLayerViewportMatrices } from "~/composition/layer/constructLayerMatrix";
import { getLayerRect } from "~/composition/layer/layerDimensions";
import { LayerManager } from "~/composition/layer/layerManager";
import { InteractionManager } from "~/composition/manager/interactionManager";
import { PropertyManager } from "~/composition/manager/propertyManager";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";
import { layerParentSort } from "~/shared/layer/layerParentSort";

export const populateLayerManager = (
	compositionId: string,
	layerManager: LayerManager,
	propertyManager: PropertyManager,
	interactions: InteractionManager,
	actionState: ActionState,
	scale: number,
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

	for (const layerId of layerIds) {
		const matrices = createLayerViewportMatrices(
			actionState,
			layerManager,
			propertyManager,
			layerId,
			scale,
		);
		const rect = getLayerRect(
			actionState,
			compositionState.layers[layerId],
			layerManager.getLayerPropertyMap(layerId),
			propertyManager.getPropertyValue,
		);
		interactions.addLayer(actionState, layerId, matrices, rect);
	}
};
