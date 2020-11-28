import { Operation } from "~/types";

export const createOperation = (): Operation => {
	const self: Operation = {
		actions: [],
		add: (..._actions) => {
			self.actions.push(..._actions);
		},
		clear: () => {
			self.actions.length = 0;
		},
	};
	return self;
};
