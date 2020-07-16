import { connect, DispatchProp, InferableComponentEnhancerWithProps } from "react-redux";
import { store } from "~/state/store";
import { HistoryState } from "~/state/history/historyReducer";
import { ActionBasedState } from "~/state/history/actionBasedReducer";
import { AreaType } from "~/constants";
import { AreaState } from "~/types/areaTypes";

const getCurrentStateFromApplicationState = (_state: ApplicationState): ActionState => {
	const state: any = _state;
	const keys = Object.keys(state) as Array<keyof ApplicationState>;
	const actionState = keys.reduce<ActionState>((obj, key) => {
		if (state[key].list) {
			obj[key] = state[key].list[state[key].index].state;
		} else {
			obj[key] = state[key].state;
		}

		return obj;
	}, {} as any);
	return actionState;
};

export const getActionStateFromApplicationState = (_state: ApplicationState): ActionState => {
	const state: any = _state;
	const keys = Object.keys(state) as Array<keyof ApplicationState>;
	const actionState = keys.reduce<ActionState>((obj, key) => {
		if (state[key].action) {
			obj[key] = state[key].action.state;
		} else if (state[key].list) {
			const s = state[key] as HistoryState<any>;
			const shiftForward =
				s.type === "selection" &&
				s.indexDirection === -1 &&
				s.list[s.index + 1].modifiedRelated;
			obj[key] = s.list[s.index + (shiftForward ? 1 : 0)].state;
		} else {
			obj[key] = state[key].state;
		}

		return obj;
	}, {} as any);
	return actionState;
};

export const createApplicationStateFromActionState = (
	actionState: ActionState,
): ApplicationState => {
	const toActionBasedState = <S extends {} = {}>(state: S): ActionBasedState<S> => ({
		action: null,
		state,
	});
	const toHistoryBasedState = <S extends {} = {}>(
		state: S,
		type: "selection" | "normal" = "normal",
	): HistoryState<S> => ({
		action: null,
		index: 0,
		indexDirection: 1,
		list: [{ state, modifiedRelated: false, name: "Initial state" }],
		type,
	});

	const state: ApplicationState = {
		area: toActionBasedState(actionState.area),
		compositionSelection: toHistoryBasedState(actionState.compositionSelection, "selection"),
		compositions: toHistoryBasedState(actionState.compositions),
		contextMenu: toActionBasedState(actionState.contextMenu),
		nodeEditor: toHistoryBasedState(actionState.nodeEditor),
		project: toHistoryBasedState(actionState.project),
		timelines: toHistoryBasedState(actionState.timelines),
		timelineSelection: toHistoryBasedState(actionState.timelineSelection, "selection"),
		tool: toActionBasedState(actionState.tool),
	};

	return state;
};

export function connectActionState<TStateProps = {}, TOwnProps = {}>(
	mapStateToProps: MapActionState<TStateProps, TOwnProps>,
): InferableComponentEnhancerWithProps<TStateProps & DispatchProp, TOwnProps> {
	return connect((state: ApplicationState, ownProps: TOwnProps) => {
		const actionState = getActionStateFromApplicationState(state);
		return mapStateToProps!(actionState, ownProps);
	});
}

export const getActionState = () => getActionStateFromApplicationState(store.getState());
export const getCurrentState = () => getCurrentStateFromApplicationState(store.getState());

export const getAreaActionState = <T extends AreaType>(areaId: string): AreaState<T> => {
	const actionState = getActionState();
	return actionState.area.areas[areaId].state as AreaState<T>;
};

export const getActionId = () => store.getState().area.action?.id || null;

(window as any).getActionState = () => getActionState();
