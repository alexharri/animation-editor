// import { useContext } from "react";
// import { CompositionLayer } from "~/composition/compositionTypes";
// import {
// 	CompositionFrameIndexContext,
// 	CompositionLayerShiftContext,
// } from "~/composition/hook/useCompositionPlayback";

export const useWorkspaceLayerShouldRender = (
	frameIndex: number,
	layerIndex: number,
	layerLength: number,
): boolean => {
	// const layerIndexShiftMap = useContext(CompositionLayerShiftContext);
	// const playbackFrameIndex = useContext(CompositionFrameIndexContext);

	// const frameIndexToUse = playbackFrameIndex === -1 ? compositionFrameIndex : playbackFrameIndex;

	return !(frameIndex < layerIndex || frameIndex > layerIndex + layerLength);
};
