import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { initialCompositionTimelineAreaState } from "~/composition/timeline/compositionTimelineAreaReducer";
import { initialCompositionWorkspaceAreaState } from "~/composition/workspace/compositionWorkspaceAreaReducer";

export const areaInitialStates: { [key in AreaType]: any } = {
	[AreaType.VectorEditor]: {},
	[AreaType.CompositionTimeline]: initialCompositionTimelineAreaState,
	[AreaType.CompositionWorkspace]: initialCompositionWorkspaceAreaState,
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.History]: {},
};
