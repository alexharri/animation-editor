import { compositionConstants } from "~/composition/compositionConstants";
import { CompositionState } from "~/composition/compositionReducer";
import { TIMELINE_HEADER_HEIGHT, TIMELINE_LAYER_HEIGHT } from "~/constants";
import { getTimelineTrackYPositions } from "~/trackEditor/trackEditorUtils";
import { LayerType } from "~/types";
import { isVecInRect } from "~/util/math";

export const getLayerTypeName = (type: LayerType): string => {
	const key = LayerType[type] as keyof typeof LayerType;
	return compositionConstants.layerTypeToName[key];
};

export const getPickWhipLayerTarget = (
	globalMousePosition: Vec2,
	fromLayerId: string,
	compositionId: string,
	compositionState: CompositionState,
	panY: number,
	viewport: Rect,
): {
	layerId: string;
} | null => {
	const yPosMap = getTimelineTrackYPositions(compositionId, compositionState, panY);

	const mousePos = globalMousePosition
		.subXY(viewport.left, viewport.top)
		.subY(TIMELINE_HEADER_HEIGHT);

	const layerIds = getValidLayerParentLayerIds(fromLayerId, compositionState);

	for (let i = 0; i < layerIds.length; i += 1) {
		const layerId = layerIds[i];
		if (layerId === fromLayerId) {
			continue;
		}

		const top = yPosMap.layer[layerId];

		const rect: Rect = {
			left: 0,
			top,
			height: TIMELINE_LAYER_HEIGHT,
			width: viewport.width,
		};

		if (isVecInRect(mousePos, rect)) {
			return { layerId: layerId };
		}
	}

	return null;
};

export const getValidLayerParentLayerIds = (
	layerId: string,
	compositionState: CompositionState,
) => {
	const layer = compositionState.layers[layerId];
	const composition = compositionState.compositions[layer.compositionId];
	const layerIds = composition.layers.filter((id) => id !== layer.id);

	const isReferencedBy = (id: string): boolean => {
		const layer = compositionState.layers[id];
		if (!layer.parentLayerId) {
			return false;
		}
		if (layer.parentLayerId === layerId) {
			return true;
		}
		return isReferencedBy(layer.parentLayerId);
	};

	return layerIds.filter((layerId) => !isReferencedBy(layerId));
};
