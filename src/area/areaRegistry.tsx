import { AreaType } from "~/constants";
import HistoryEditor from "~/historyEditor/HistoryEditor";
import { NodeEditor } from "~/nodeEditor/NodeEditor";
import { nodeEditorAreaReducer } from "~/nodeEditor/nodeEditorAreaReducer";
import { Project } from "~/project/Project";
import { Timeline } from "~/timeline/Timeline";
import { timelineAreaReducer } from "~/timeline/timelineAreaReducer";
import { AreaComponentProps, AreaState } from "~/types/areaTypes";
import { Workspace } from "~/workspace/Workspace";
import { compositionWorkspaceAreaReducer } from "~/workspace/workspaceAreaReducer";

export const areaComponentRegistry: {
	[T in AreaType]: React.ComponentType<AreaComponentProps<AreaState<T>>>;
} = {
	[AreaType.Timeline]: Timeline,
	[AreaType.Workspace]: Workspace,
	[AreaType.NodeEditor]: NodeEditor,
	[AreaType.History]: HistoryEditor,
	[AreaType.Project]: Project,
};

export const areaStateReducerRegistry: {
	[T in AreaType]: (state: AreaState<T>, action: any) => AreaState<T>;
} = {
	[AreaType.Timeline]: timelineAreaReducer,
	[AreaType.Workspace]: compositionWorkspaceAreaReducer,
	[AreaType.NodeEditor]: nodeEditorAreaReducer,
	[AreaType.History]: () => ({}),
	[AreaType.Project]: () => ({}),
};

export const _areaReactKeyRegistry: Partial<
	{
		[T in AreaType]: keyof AreaState<T>;
	}
> = {
	[AreaType.Timeline]: "compositionId",
	[AreaType.Workspace]: "compositionId",
	[AreaType.NodeEditor]: "graphId",
};
