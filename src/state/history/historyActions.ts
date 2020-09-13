import { action } from "typesafe-actions";

export const historyActions = {
	moveHistoryIndex: (index: number) => action("history/MOVE_INDEX", { index }),

	startAction: (actionId: string) => {
		return action("history/START_ACTION", { actionId });
	},

	dispatchToAction: (actionId: string, actionToDispatch: any, modifiesHistory: boolean) => {
		return action("history/DISPATCH_TO_ACTION", {
			actionId,
			actionToDispatch,
			modifiesHistory,
		});
	},

	dispatchBatchToAction: (actionId: string, actionBatch: any[], modifiesHistory: boolean) => {
		return action("history/DISPATCH_BATCH_TO_ACTION", {
			actionId,
			actionBatch,
			modifiesHistory,
		});
	},

	submitAction: (
		actionId: string,
		name: string,
		modifiesHistory: boolean,
		modifiedKeys: string[],
		allowIndexShift: boolean,
	) => {
		return action("history/SUBMIT_ACTION", {
			actionId,
			name,
			modifiesHistory,
			modifiedKeys,
			allowIndexShift,
		});
	},

	cancelAction: (actionId: string) => {
		return action("history/CANCEL_ACTION", { actionId });
	},
};
