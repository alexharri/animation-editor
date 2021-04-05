import { DiffFactoryFn } from "~/diff/diffFactory";
import { RequestActionParams } from "~/listener/requestAction";
import { getActionState } from "~/state/stateUtils";
import { Operation } from "~/types";

export const createOperation = (params: RequestActionParams): Operation => {
	const diffsToAdd: DiffFactoryFn[] = [];
	const diffsToPerform: DiffFactoryFn[] = [];

	const self: Operation = {
		actions: [],
		add: (..._actions) => {
			self.actions.push(..._actions);
		},
		clear: () => {
			self.actions.length = 0;
		},
		addDiff: (fn) => diffsToAdd.push(fn),
		performDiff: (fn) => diffsToPerform.push(fn),
		submit: () => {
			params.dispatch(self.actions);
			diffsToPerform.forEach(params.performDiff);
			diffsToAdd.forEach((diff) => params.addDiff(diff));
			self.state = getActionState();
			self.actions.length = 0;
			diffsToAdd.length = 0;
			diffsToPerform.length = 0;
		},
		state: getActionState(),
	};

	return self;
};
