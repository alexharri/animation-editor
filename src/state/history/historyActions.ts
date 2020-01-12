import { action } from "typesafe-actions";

export const historyActions = {
	moveHistoryIndex: (index: number) => action("history/MOVE_INDEX", { index }),

	startAction: (actionId: string) => {
		return action("history/START_ACTION", { actionId });
	},

	dispatchToAction: (actionId: string, actionToDispatch: number) => {
		return action("history/DISPATCH_TO_ACTION", { actionId, actionToDispatch });
	},

	submitAction: (actionId: string, name: string) => {
		return action("history/SUBMIT_ACTION", { actionId, name });
	},

	cancelAction: (actionId: string) => {
		return action("history/CANCEL_ACTION", { actionId });
	},
};
