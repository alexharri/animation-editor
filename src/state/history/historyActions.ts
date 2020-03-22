import { action } from "typesafe-actions";

export const historyActions = {
	moveHistoryIndex: (index: number) => action("history/MOVE_INDEX", { index }),

	startAction: (actionId: string) => {
		return action("history/START_ACTION", { actionId });
	},

	dispatchToAction: (actionId: string, actionToDispatch: number, modifiesHistory: boolean) => {
		return action("history/DISPATCH_TO_ACTION", {
			actionId,
			actionToDispatch,
			modifiesHistory,
		});
	},

	submitAction: (actionId: string, name: string, modifiesHistory: boolean) => {
		return action("history/SUBMIT_ACTION", { actionId, name, modifiesHistory });
	},

	cancelAction: (actionId: string) => {
		return action("history/CANCEL_ACTION", { actionId });
	},
};
