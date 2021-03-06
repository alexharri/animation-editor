import { connect, DispatchProp, InferableComponentEnhancerWithProps } from "react-redux";
import { AreaType } from "~/constants";
import { HistoryState } from "~/state/history/historyReducer";
import { store } from "~/state/store";
import { AreaState } from "~/types/areaTypes";

const getCurrentStateFromApplicationState = (_state: ApplicationState): ActionState => {
	const state: any = _state;
	const keys = Object.keys(state) as Array<keyof ApplicationState>;
	const actionState = keys.reduce<ActionState>((obj, key) => {
		if (state[key].list) {
			const s = state[key] as HistoryState<any>;
			const shiftForward =
				s.index > 0 &&
				s.type === "selection" &&
				s.indexDirection === -1 &&
				s.list[s.index + 1].modifiedRelated &&
				s.list[s.index + 1].allowIndexShift;

			obj[key] = s.list[s.index + (shiftForward ? 1 : 0)].state;
		} else {
			obj[key] = state[key].state;
		}

		return obj;
	}, {} as any);
	return actionState;
};

export const getActionStateFromApplicationState = (
	_state: ApplicationState,
	index?: number,
): ActionState => {
	const state: any = _state;
	const keys = Object.keys(state) as Array<keyof ApplicationState>;
	const actionState = keys.reduce<ActionState>((obj, key) => {
		if (state[key].action) {
			obj[key] = state[key].action.state;
		} else if (state[key].list) {
			const s = state[key] as HistoryState<any>;
			const shiftForward =
				typeof index === "undefined" &&
				s.type === "selection" &&
				s.indexDirection === -1 &&
				s.list[s.index + 1].modifiedRelated &&
				s.list[s.index + 1].allowIndexShift;

			obj[key] = s.list[index ?? s.index + (shiftForward ? 1 : 0)].state;
		} else {
			obj[key] = state[key].state;
		}

		return obj;
	}, {} as any);
	return actionState;
};

export function connectActionState<TStateProps = {}, TOwnProps = {}>(
	mapStateToProps: MapActionState<TStateProps, TOwnProps>,
): InferableComponentEnhancerWithProps<TStateProps & DispatchProp, TOwnProps> {
	return connect((state: ApplicationState, ownProps: TOwnProps) => {
		try {
			const actionState = getActionStateFromApplicationState(state);
			return mapStateToProps!(actionState, ownProps);
		} catch (e) {
			console.error(e);
			return {};
		}
	});
}

export const getActionState = () => getActionStateFromApplicationState(store.getState());
export const getCurrentState = () => getCurrentStateFromApplicationState(store.getState());

export const areaActionStateFromState = <T extends AreaType>(
	areaId: string,
	actionState: ActionState,
): AreaState<T> => {
	return actionState.area.areas[areaId].state as AreaState<T>;
};
export const getAreaActionState = <T extends AreaType>(areaId: string): AreaState<T> => {
	const actionState = getActionState();
	return areaActionStateFromState<T>(areaId, actionState);
};

export const getActionId = () => store.getState().area.action?.id || null;
export const getIsActionInProgress = () => !!(store.getState().area.action?.id || null);

(window as any).getState = () => store.getState();
(window as any).getActionState = () => getActionState();
