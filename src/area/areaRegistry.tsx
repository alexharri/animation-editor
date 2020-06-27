import { VectorEditor } from "~/vectorEditor/VectorEditor";
import { AreaType } from "~/constants";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";
import HistoryEditor from "~/historyEditor/HistoryEditor";
import { compositionTimelineAreaReducer } from "~/composition/timeline/compositionTimelineAreaReducer";
import { CompositionTimeline } from "~/composition/timeline/CompositionTimeline";
import { CompositionWorkspace } from "~/composition/workspace/CompositionWorkspace";
import { compositionWorkspaceAreaReducer } from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { AreaState, AreaComponentProps } from "~/types/areaTypes";

export const areaComponentRegistry: {
	[T in AreaType]: React.ComponentType<AreaComponentProps<AreaState<T>>>;
} = {
	[AreaType.VectorEditor]: VectorEditor,
	[AreaType.CompositionTimeline]: CompositionTimeline,
	[AreaType.CompositionWorkspace]: CompositionWorkspace,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.History]: HistoryEditor,
};

export const areaStateReducerRegistry: {
	[T in AreaType]: (state: AreaState<T>, action: any) => AreaState<T>;
} = {
	[AreaType.VectorEditor]: () => ({} as any),
	[AreaType.CompositionTimeline]: compositionTimelineAreaReducer,
	[AreaType.CompositionWorkspace]: compositionWorkspaceAreaReducer,
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.History]: () => ({}),
};
