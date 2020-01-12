import { connect, DispatchProp, InferableComponentEnhancerWithProps } from "react-redux";
import { store } from "~/state/store";

const getActionStateFromApplicationState = (state: ApplicationState): ActionState => {
	const keys = Object.keys(state) as Array<keyof ApplicationState>;
	const actionState = keys.reduce<ActionState>((obj, key) => {
		obj[key] = state[key].action?.state || state[key].state;
		return obj;
	}, {} as any);
	return actionState;
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

export const getActionId = () => store.getState().area.action?.id || null;
