import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { getShapeLayerSelectedPathIds } from "~/shape/shapeUtils";
import { LayerType } from "~/types";

export function shouldShowInteractions(
	actionState: ActionState,
	layerId: string,
	isLayerHovered: boolean,
): Record<keyof InteractionContainers, boolean> {
	const { compositionState, compositionSelectionState } = actionState;

	const layer = compositionState.layers[layerId];
	const selection = compSelectionFromState(layer.compositionId, compositionSelectionState);
	const isLayerSelected = !!selection.layers[layerId];

	let showRect = isLayerHovered || isLayerSelected;
	let showCorners = isLayerSelected;

	if (layer.type === LayerType.Shape) {
		const selectedPathIds = getShapeLayerSelectedPathIds(
			layerId,
			compositionState,
			compositionSelectionState,
		);

		if (selectedPathIds.length) {
			showRect = false;
			showCorners = false;
		}
	}

	return {
		anchor: isLayerSelected,
		rect: showRect,
		rectCorners: showCorners,
		layerSpecific: true,
	};
}
