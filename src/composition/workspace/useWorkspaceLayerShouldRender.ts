import { useContext } from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { CompWorkspacePlaybackContext } from "~/composition/workspace/useWorkspacePlayback";

export const useWorkspaceLayerShouldRender = (layer: CompositionLayer): boolean => {
	const playback = useContext(CompWorkspacePlaybackContext);
	const frameIndex = playback.layerIdToFrameIndex[layer.id];
	return !(frameIndex < layer.index || frameIndex > layer.index + layer.length);
};
