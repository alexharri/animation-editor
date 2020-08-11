import { initialCompTimeAreaState } from "~/composition/timeline/compTimeAreaReducer";
import { initialCompositionWorkspaceAreaState } from "~/composition/workspace/compWorkspaceAreaReducer";
import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { AreaState } from "~/types/areaTypes";

export const areaInitialStates: { [K in AreaType]: AreaState<K> } = {
	[AreaType.CompositionTimeline]: initialCompTimeAreaState,
	[AreaType.CompositionWorkspace]: initialCompositionWorkspaceAreaState,
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.History]: {},
	[AreaType.Project]: {},
};
