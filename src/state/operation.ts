import { RequestActionParams } from "~/listener/requestAction";
import { getActionState } from "~/state/stateUtils";
import { Operation } from "~/types";

export const createOperation = (params: RequestActionParams): Operation => {
	const self: Operation = {
		actions: [],
		add: (..._actions) => {
			self.actions.push(..._actions);
		},
		clear: () => {
			self.actions.length = 0;
		},
		addDiff: params.addDiff,
		performDiff: params.performDiff,
		submit: () => {
			params.dispatch(self.actions);
			self.state = getActionState();
			self.actions.length = 0;
		},
		state: getActionState(),
	};

	return self;
};
