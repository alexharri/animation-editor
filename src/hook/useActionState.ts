import { useSelector, shallowEqual } from "react-redux";
import { getActionStateFromApplicationState } from "~/state/stateUtils";

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
