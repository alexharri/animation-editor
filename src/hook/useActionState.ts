import { useEffect, useMemo, useRef } from "react";
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

export const useMemoActionState = <T>(selector: Selector<T>, deps: React.DependencyList): T => {
	const selectorRef = useRef(selector);
	selectorRef.current = selector;

	return useMemo(() => {
		const actionState = getActionStateFromApplicationState(store.getState());
		return selectorRef.current(actionState);
	}, deps);
};

export const useActionStateEffect = (
	callback: (state: ActionState, prevState: ActionState) => void,
): void => {
	useEffect(() => {
		let prevState: ActionState = getActionStateFromApplicationState(store.getState());

		const unsub = store.subscribe(() => {
			const state = getActionStateFromApplicationState(store.getState());

			try {
				callback(state, prevState);
			} catch (e) {
				console.error(e);
			}

			prevState = state;
		});

		return unsub;
	}, []);
};
