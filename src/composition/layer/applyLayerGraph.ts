import { LayerPropertyMap } from "~/composition/layer/layerPropertyMap";

export const applyLayerGraph = (
	actionState: ActionState,
	map: LayerPropertyMap,
	graphId: string,
) => {
	const { compositionState, flowState } = actionState;

	const graph = flowState.graphs[graphId];
};
