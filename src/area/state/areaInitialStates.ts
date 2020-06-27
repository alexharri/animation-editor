import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { initialCompositionTimelineAreaState } from "~/composition/timeline/compositionTimelineAreaReducer";
import { initialCompositionWorkspaceAreaState } from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { AreaState } from "~/types/areaTypes";

export const areaInitialStates: { [K in AreaType]: AreaState<K> } = {
	[AreaType.VectorEditor]: {},
	[AreaType.CompositionTimeline]: initialCompositionTimelineAreaState,
	[AreaType.CompositionWorkspace]: initialCompositionWorkspaceAreaState,
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.History]: {},
};
