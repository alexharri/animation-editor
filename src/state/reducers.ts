import { combineReducers } from "redux";
import { AreaState, areaReducer, initialAreaState } from "~/area/state/areaReducer";
import { ActionBasedState, createActionBasedReducer } from "~/state/history/actionBasedReducer";
import { ToolState, toolReducer, initialToolState } from "~/toolbar/toolReducer";
import {
	contextMenuReducer,
	initialContextMenuState,
	ContextMenuState,
} from "~/contextMenu/contextMenuReducer";

declare global {
	interface ApplicationState {
		area: ActionBasedState<AreaState>;
		contextMenu: ActionBasedState<ContextMenuState>;
		tool: ActionBasedState<ToolState>;
	}

	interface ActionState {
		area: AreaState;
		contextMenu: ContextMenuState;
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
	contextMenu: createActionBasedReducer(initialContextMenuState, contextMenuReducer),
	tool: createActionBasedReducer(initialToolState, toolReducer),
};

export default combineReducers<ApplicationState>(reducers);
