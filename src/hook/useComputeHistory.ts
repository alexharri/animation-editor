import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";

type Selector<T> = (actionState: ActionState) => T;

export const useComputeHistory = <T>(selector: Selector<T>): T => {
	const index = useSelector((state: ApplicationState) => state.flowState.index);

	const getState = useCallback(() => {
		const state = store.getState();
		const actionState = getActionStateFromApplicationState(state);
		return selector(actionState);
	}, [index]);

	const [state, setState] = useState(getState);

	useEffect(() => {
		setState(getState());
	}, [index]);

	return state;
};
