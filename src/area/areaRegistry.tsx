import { AreaType } from "~/constants";
import { FlowEditor } from "~/flow/FlowEditor";
import { flowEditorKeyboardShortcuts } from "~/flow/flowEditorKeyboardShortcuts";
import { flowAreaReducer } from "~/flow/state/flowAreaReducer";
import HistoryEditor from "~/historyEditor/HistoryEditor";
import { Project } from "~/project/Project";
import { Timeline } from "~/timeline/Timeline";
import { timelineAreaReducer } from "~/timeline/timelineAreaReducer";
import { timelineKeyboardShortcuts } from "~/timeline/timelineShortcuts";
import { KeyboardShortcut } from "~/types";
import { AreaComponentProps, AreaState } from "~/types/areaTypes";
import { PixiWorkspace } from "~/workspace/PixiWorkspace";
// import { Workspace } from "~/workspace/Workspace";
import { compositionWorkspaceAreaReducer } from "~/workspace/workspaceAreaReducer";
import { workspaceKeyboardShortcuts } from "~/workspace/workspaceShortcuts";

export const areaComponentRegistry: {
	[T in AreaType]: React.ComponentType<AreaComponentProps<AreaState<T>>>;
} = {
	[AreaType.Timeline]: Timeline,
	[AreaType.Workspace]: PixiWorkspace,
	[AreaType.FlowEditor]: FlowEditor,
	[AreaType.History]: HistoryEditor,
	[AreaType.Project]: Project,
};

export const areaStateReducerRegistry: {
	[T in AreaType]: (state: AreaState<T>, action: any) => AreaState<T>;
} = {
	[AreaType.Timeline]: timelineAreaReducer,
	[AreaType.Workspace]: compositionWorkspaceAreaReducer,
	[AreaType.FlowEditor]: flowAreaReducer,
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
	[AreaType.FlowEditor]: "graphId",
};

export const areaKeyboardShortcutRegistry: Partial<
	{
		[T in AreaType]: KeyboardShortcut[];
	}
> = {
	[AreaType.Timeline]: timelineKeyboardShortcuts,
	[AreaType.FlowEditor]: flowEditorKeyboardShortcuts,
	[AreaType.Workspace]: workspaceKeyboardShortcuts,
};
