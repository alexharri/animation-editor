import { VectorEditor } from "~/vectorEditor/VectorEditor";
import { AreaType } from "~/constants";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";
import HistoryEditor from "~/historyEditor/HistoryEditor";
import { compositionTimelineAreaReducer } from "~/composition/timeline/compositionTimelineAreaReducer";
import { CompositionTimeline } from "~/composition/timeline/CompositionTimeline";
import { CompositionWorkspace } from "~/composition/workspace/CompositionWorkspace";
import { compositionWorkspaceAreaReducer } from "~/composition/workspace/compositionWorkspaceAreaReducer";

export const areaComponentRegistry = {
	[AreaType.VectorEditor]: VectorEditor,
	[AreaType.CompositionTimeline]: CompositionTimeline,
	[AreaType.CompositionWorkspace]: CompositionWorkspace,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.History]: HistoryEditor,
};

export const areaStateReducerRegistry = {
	[AreaType.VectorEditor]: () => ({} as any),
	[AreaType.CompositionTimeline]: compositionTimelineAreaReducer,
	[AreaType.CompositionWorkspace]: compositionWorkspaceAreaReducer,
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.History]: () => ({}),
};
