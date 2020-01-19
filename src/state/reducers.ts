import { combineReducers } from "redux";
import { AreaState, areaReducer, initialAreaState } from "~/area/state/areaReducer";
import { ActionBasedState, createActionBasedReducer } from "~/state/history/actionBasedReducer";
import { ToolState, toolReducer, initialToolState } from "~/toolbar/toolReducer";

declare global {
	interface ApplicationState {
		area: ActionBasedState<AreaState>;
		tool: ActionBasedState<ToolState>;
	}

	interface ActionState {
		area: AreaState;
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
	tool: createActionBasedReducer(initialToolState, toolReducer),
};

export default combineReducers<ApplicationState>(reducers);
