import { CompTime } from "~/composition/timeline/CompTime";
import { compTimeAreaReducer } from "~/composition/timeline/compTimeAreaReducer";
import { compositionWorkspaceAreaReducer } from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { CompositionWorkspace } from "~/composition/workspace/CompWorkspace";
import { AreaType } from "~/constants";
import HistoryEditor from "~/historyEditor/HistoryEditor";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";
import { Project } from "~/project/Project";
import { AreaComponentProps, AreaState } from "~/types/areaTypes";
import { VectorEditor } from "~/vectorEditor/VectorEditor";

export const areaComponentRegistry: {
	[T in AreaType]: React.ComponentType<AreaComponentProps<AreaState<T>>>;
} = {
	[AreaType.VectorEditor]: VectorEditor,
	[AreaType.CompositionTimeline]: CompTime,
	[AreaType.CompositionWorkspace]: CompositionWorkspace,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.History]: HistoryEditor,
	[AreaType.Project]: Project,
};

export const areaStateReducerRegistry: {
	[T in AreaType]: (state: AreaState<T>, action: any) => AreaState<T>;
} = {
	[AreaType.VectorEditor]: () => ({} as any),
	[AreaType.CompositionTimeline]: compTimeAreaReducer,
	[AreaType.CompositionWorkspace]: compositionWorkspaceAreaReducer,
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.History]: () => ({}),
	[AreaType.Project]: () => ({}),
};
