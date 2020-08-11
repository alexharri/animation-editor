import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { initialTimelineAreaState } from "~/timeline/timelineAreaReducer";
import { AreaState } from "~/types/areaTypes";
import { initialCompositionWorkspaceAreaState } from "~/workspace/workspaceAreaReducer";

export const areaInitialStates: { [K in AreaType]: AreaState<K> } = {
	[AreaType.Timeline]: initialTimelineAreaState,
	[AreaType.Workspace]: initialCompositionWorkspaceAreaState,
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.History]: {},
	[AreaType.Project]: {},
};
