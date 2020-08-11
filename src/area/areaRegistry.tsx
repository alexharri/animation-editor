import { CompTime } from "~/composition/timeline/CompTime";
import { compTimeAreaReducer } from "~/composition/timeline/compTimeAreaReducer";
import { compositionWorkspaceAreaReducer } from "~/composition/workspace/compWorkspaceAreaReducer";
import { CompWorkspace } from "~/composition/workspace/CompWorkspaceCanvas";
import { AreaType } from "~/constants";
import HistoryEditor from "~/historyEditor/HistoryEditor";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";
import { Project } from "~/project/Project";
import { AreaComponentProps, AreaState } from "~/types/areaTypes";

export const areaComponentRegistry: {
	[T in AreaType]: React.ComponentType<AreaComponentProps<AreaState<T>>>;
} = {
	[AreaType.CompositionTimeline]: CompTime,
	[AreaType.CompositionWorkspace]: CompWorkspace,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.History]: HistoryEditor,
	[AreaType.Project]: Project,
};

export const areaStateReducerRegistry: {
	[T in AreaType]: (state: AreaState<T>, action: any) => AreaState<T>;
} = {
	[AreaType.CompositionTimeline]: compTimeAreaReducer,
	[AreaType.CompositionWorkspace]: compositionWorkspaceAreaReducer,
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.History]: () => ({}),
	[AreaType.Project]: () => ({}),
};

export const _areaReactKeyRegistry: Partial<
	{
		[T in AreaType]: keyof AreaState<T>;
	}
> = {
	[AreaType.CompositionTimeline]: "compositionId",
	[AreaType.CompositionWorkspace]: "compositionId",
	[AreaType.NodeEditor]: "graphId",
};
