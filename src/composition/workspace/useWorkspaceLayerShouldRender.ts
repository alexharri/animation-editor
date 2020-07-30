import { useContext } from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import {
	CompositionFrameIndexContext,
	CompositionLayerShiftContext,
} from "~/composition/hook/useCompositionPlayback";

export const useWorkspaceLayerShouldRender = (
	layer: CompositionLayer,
	compositionFrameIndex: number,
): boolean => {
	const layerIndexShiftMap = useContext(CompositionLayerShiftContext);
	const playbackFrameIndex = useContext(CompositionFrameIndexContext);

	const frameIndexToUse = playbackFrameIndex === -1 ? compositionFrameIndex : playbackFrameIndex;

	const frameIndex = frameIndexToUse + layerIndexShiftMap[layer.id];
	return !(frameIndex < layer.index || frameIndex > layer.index + layer.length);
};
