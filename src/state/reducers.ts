import { combineReducers } from "redux";
import { AreaState, areaReducer, initialAreaState } from "~/area/state/areaReducer";
import { ActionBasedState, createActionBasedReducer } from "~/state/history/actionBasedReducer";
import { ToolState, toolReducer, initialToolState } from "~/toolbar/toolReducer";
import {
	contextMenuReducer,
	initialContextMenuState,
	ContextMenuState,
} from "~/contextMenu/contextMenuReducer";
import {
	NodeEditorState,
	initialNodeEditorState,
	nodeEditorReducer,
} from "~/nodeEditor/nodeEditorReducers";
import { HistoryState, createReducerWithHistory } from "~/state/history/historyReducer";
import { initialTimelineState, timelineReducer, TimelineState } from "~/timeline/timelineReducer";
import {
	CompositionState,
	initialCompositionState,
	compositionReducer,
} from "~/composition/state/compositionReducer";
import {
	initialCompositionSelectionState,
	compositionSelectionReducer,
	CompositionSelectionState,
} from "~/composition/state/compositionSelectionReducer";
import {
	TimelineSelectionState,
	initialTimelineSelectionState,
	timelineSelectionReducer,
} from "~/timeline/timelineSelectionReducer";

declare global {
	interface ApplicationState {
		area: ActionBasedState<AreaState>;
		compositions: HistoryState<CompositionState>;
		compositionSelection: HistoryState<CompositionSelectionState>;
		nodeEditor: HistoryState<NodeEditorState>;
		contextMenu: ActionBasedState<ContextMenuState>;
		timelines: HistoryState<TimelineState>;
		timelineSelection: HistoryState<TimelineSelectionState>;
		tool: ActionBasedState<ToolState>;
	}

	interface ActionState {
		area: AreaState;
		compositions: CompositionState;
		compositionSelection: CompositionSelectionState;
		nodeEditor: NodeEditorState;
		contextMenu: ContextMenuState;
		timelines: TimelineState;
		timelineSelection: TimelineSelectionState;
		tool: ToolState;
	}

	type MapApplicationState<StateProps, OwnProps = {}> = (
		state: ApplicationState,
		ownProps: OwnProps,
	) => StateProps;

	type MapActionState<StateProps, OwnProps = {}> = (
		state: ActionState,
		ownProps: OwnProps,
	) => StateProps;
}

const reducers = {
	area: createActionBasedReducer(initialAreaState, areaReducer),

	compositions: createReducerWithHistory(initialCompositionState, compositionReducer),
	compositionSelection: createReducerWithHistory(
		initialCompositionSelectionState,
		compositionSelectionReducer,
		{ selectionForKey: "compositions" },
	),

	nodeEditor: createReducerWithHistory(initialNodeEditorState, nodeEditorReducer),
	contextMenu: createActionBasedReducer(initialContextMenuState, contextMenuReducer),

	timelines: createReducerWithHistory(initialTimelineState, timelineReducer),
	timelineSelection: createReducerWithHistory(
		initialTimelineSelectionState,
		timelineSelectionReducer,
		{ selectionForKey: "timelines" },
	),

	tool: createActionBasedReducer(initialToolState, toolReducer),
};

export default combineReducers<ApplicationState>(reducers);
