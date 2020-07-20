import { AreaType } from "~/constants";
import { initialNodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { initialCompTimeAreaState } from "~/composition/timeline/compTimeAreaReducer";
import { initialCompositionWorkspaceAreaState } from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { AreaState } from "~/types/areaTypes";

export const areaInitialStates: { [K in AreaType]: AreaState<K> } = {
	[AreaType.VectorEditor]: {},
	[AreaType.CompositionTimeline]: initialCompTimeAreaState,
	[AreaType.CompositionWorkspace]: initialCompositionWorkspaceAreaState,
	[AreaType.NodeEditor]: initialNodeEditorAreaState,
	[AreaType.History]: {},
	[AreaType.Project]: {},
};
