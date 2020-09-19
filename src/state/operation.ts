import { Action, Operation } from "~/types";

export const createOperation = (): Operation => {
	const _actions: Action[] = [];
	return {
		actions: _actions,
		add: (...actions) => {
			_actions.push(...actions);
		},
	};
};
