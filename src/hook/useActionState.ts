import { useEffect } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";

type Selector<T> = (actionState: ActionState) => T;

export const useActionState = <T>(selector: Selector<T>, { shallow = true } = {}): T => {
	const result = useSelector<ApplicationState, T>(
		(state) => {
			const actionState = getActionStateFromApplicationState(state);
			return selector(actionState);
		},
		shallow ? shallowEqual : undefined,
	);
	return result;
};

export const useActionStateEffect = (
	callback: (state: ActionState, prevState: ActionState) => void,
): void => {
	useEffect(() => {
		let prevState: ActionState = getActionStateFromApplicationState(store.getState());

		const unsub = store.subscribe(() => {
			const state = getActionStateFromApplicationState(store.getState());
			callback(state, prevState);
			prevState = state;
		});

		return unsub;
	}, []);
};
