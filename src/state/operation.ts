import { DiffFactoryFn } from "~/diff/diffFactory";
import { RequestActionParams } from "~/listener/requestAction";
import { getActionState } from "~/state/stateUtils";
import { Action, Operation } from "~/types";

export const createOperation = (params: RequestActionParams): Operation => {
	const diffsToAdd: DiffFactoryFn[] = [];
	const diffsToPerform: DiffFactoryFn[] = [];

	const actions: Action[] = [];

	const self: Operation = {
		add: (..._actions) => {
			actions.push(..._actions);
		},
		clear: () => {
			actions.length = 0;
			diffsToAdd.length = 0;
			diffsToPerform.length = 0;
		},
		addDiff: (fn) => diffsToAdd.push(fn),
		performDiff: (fn) => diffsToPerform.push(fn),
		submit: () => {
			params.dispatch(actions);
			diffsToPerform.forEach(params.performDiff);
			diffsToAdd.forEach((diff) => params.addDiff(diff));
			self.state = getActionState();
			self.clear();
		},
		state: getActionState(),
	};

	return self;
};

export const performOperation = (
	params: RequestActionParams,
	fn: (op: Operation) => void,
): void => {
	const op = createOperation(params);
	fn(op);
	op.submit();
};
