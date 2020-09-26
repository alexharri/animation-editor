import { AreaType } from "~/constants";
import { initialFlowAreaState } from "~/flow/flowAreaReducer";
import { initialTimelineAreaState } from "~/timeline/timelineAreaReducer";
import { AreaState } from "~/types/areaTypes";
import { initialCompositionWorkspaceAreaState } from "~/workspace/workspaceAreaReducer";

export const areaInitialStates: { [K in AreaType]: AreaState<K> } = {
	[AreaType.Timeline]: initialTimelineAreaState,
	[AreaType.Workspace]: initialCompositionWorkspaceAreaState,
	[AreaType.FlowEditor]: initialFlowAreaState,
	[AreaType.History]: {},
	[AreaType.Project]: {},
};
