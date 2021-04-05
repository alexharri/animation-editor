import { areaActions } from "~/area/state/areaActions";
import { diffFactory, DiffFactoryFn } from "~/diff/diffFactory";
import { Diff } from "~/diff/diffs";
import { addListener as _addListener, removeListener } from "~/listener/addListener";
import { sendDiffsToSubscribers } from "~/listener/diffListener";
import { historyActions } from "~/state/history/historyActions";
import { HistoryState } from "~/state/history/historyReducer";
import { getActionId, getActionState, getCurrentState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { Action } from "~/types";

let _n = 0;

export type ShouldAddToStackFn = (prevState: ActionState, nextState: ActionState) => boolean;

interface RequestActionOptions {
	history?: boolean;
	shouldAddToStack?: ShouldAddToStackFn | ShouldAddToStackFn[];
	beforeSubmit?: (params: RequestActionParams) => void;
}

interface SubmitOptions {
	allowIndexShift: boolean;
}

export interface RequestActionParams {
	dispatch: (action: Action | Action[], ...otherActions: Action[]) => void;
	dispatchToAreaState: (areaId: string, action: Action) => void;
	cancelAction: () => void;
	submitAction: (name?: string, options?: Partial<SubmitOptions>) => void;
	addListener: typeof _addListener;
	removeListener: typeof removeListener;
	execOnComplete: (callback: () => void) => void;
	done: () => boolean;
	addDiff: (fn: DiffFactoryFn, options?: { perform: boolean }) => void;
	performDiff: (fn: DiffFactoryFn) => void;
	addReverseDiff: (fn: DiffFactoryFn) => void;
}

export interface RequestActionCallback {
	(params: RequestActionParams): void;
}

const performRequestedAction = (
	{ history = false, shouldAddToStack, beforeSubmit }: RequestActionOptions,
	callback: RequestActionCallback,
): void => {
	const actionId = (++_n).toString();
	const cancelTokens: string[] = [];

	const done = () => actionId !== getActionId();

	const addListener = Object.keys(_addListener).reduce<typeof _addListener>((obj, key) => {
		(obj as any)[key] = (...args: any[]) => {
			if (done()) {
				return;
			}

			const cancelToken = (_addListener as any)[key](...args);
			cancelTokens.push(cancelToken);
			return cancelToken;
		};
		return obj;
	}, {} as any);

	let onCompleteCallback: (() => void) | null = null;

	const onComplete = () => {
		cancelTokens.forEach((cancelToken) => removeListener(cancelToken));

		if (onCompleteCallback) {
			onCompleteCallback();
		}
	};

	const diffs: Diff[] = [];
	const allDiffs: Diff[] = [];
	const addedButNotPerformedDiffs: Diff[] = [];

	// The diffs to perform to reverse the performed to reverse the diffs
	// that have been performed by the current action.
	//
	// If none are specified, the performed diffs are performed again in
	// reverse order.
	const reverseDiffs: Diff[] = [];

	const cancelAction = () => {
		store.dispatch(historyActions.cancelAction(actionId));
		onComplete();

		const diffsToPerform = reverseDiffs.length ? reverseDiffs : [...allDiffs].reverse();
		sendDiffsToSubscribers(getActionState(), diffsToPerform, "backward");
	};

	store.dispatch(historyActions.startAction(actionId));

	const escToken = addListener.keyboardOnce("Esc", "keydown", cancelAction);
	cancelTokens.push(escToken);

	const dispatch: RequestActionParams["dispatch"] = (action, ...args) => {
		if (Array.isArray(action)) {
			if (args.length) {
				console.warn(
					"Dispatch received an array as the first argument AND received additional arguments.",
				);
			}

			store.dispatch(historyActions.dispatchBatchToAction(actionId, action, history));
			return;
		}

		if (args.length) {
			store.dispatch(
				historyActions.dispatchBatchToAction(actionId, [action, ...args], history),
			);
			return;
		}

		store.dispatch(historyActions.dispatchToAction(actionId, action, history));
	};

	const params: RequestActionParams = {
		done,

		dispatch,

		dispatchToAreaState: (areaId, action) => {
			dispatch(areaActions.dispatchToAreaState(areaId, action));
		},

		submitAction: (name = "Unknown action", { allowIndexShift = false } = {}) => {
			if (!getActionId()) {
				console.warn("Attempted to submit an action that does not exist.");
				return;
			}

			if (getActionId() !== actionId) {
				console.warn("Attempted to submit with the wrong action id.");
				return;
			}

			const shouldAddToStackFns: ShouldAddToStackFn[] = [];

			if (Array.isArray(shouldAddToStack)) {
				shouldAddToStackFns.push(...shouldAddToStack);
			} else if (typeof shouldAddToStack === "function") {
				shouldAddToStackFns.push(shouldAddToStack);
			}

			let addToStack = typeof shouldAddToStack === "undefined";

			for (const shouldAddToStack of shouldAddToStackFns) {
				if (shouldAddToStack(getCurrentState(), getActionState())) {
					addToStack = true;
				}
			}

			if (!addToStack) {
				store.dispatch(historyActions.cancelAction(actionId));
				onComplete();
				return;
			}

			if (beforeSubmit) {
				beforeSubmit(params);
			}

			if (diffs.length) {
				sendDiffsToSubscribers(getActionState(), diffs);
			}

			const modifiedKeys: string[] = [];
			{
				const state: any = store.getState();
				const keys = Object.keys(state) as Array<keyof ApplicationState>;
				for (let i = 0; i < keys.length; i += 1) {
					const key = keys[i];
					if (!state[key].list) {
						continue;
					}

					const s = state[key] as HistoryState<any>;
					if (s.action!.state !== s.list[s.index].state) {
						modifiedKeys.push(key);
					}
				}
			}

			store.dispatch(
				historyActions.submitAction(
					actionId,
					name,
					history,
					modifiedKeys,
					allowIndexShift,
					[...diffs, ...addedButNotPerformedDiffs],
				),
			);
			onComplete();
		},

		cancelAction,

		addListener,

		removeListener,

		execOnComplete: (cb) => {
			onCompleteCallback = cb;
		},

		addDiff: (fn, options = { perform: true }) => {
			const result = fn(diffFactory);
			const diffsToAdd = Array.isArray(result) ? result : [result];

			if (options.perform) {
				diffs.push(...diffsToAdd);
				allDiffs.push(...diffsToAdd);
				// The diffs are not performed when added. Added diffs are performed when
				// the action is submitted.
			} else {
				addedButNotPerformedDiffs.push(...diffsToAdd);
			}
		},

		performDiff: (fn) => {
			const result = fn(diffFactory);
			const diffsToPerform = Array.isArray(result) ? result : [result];
			allDiffs.push(...diffsToPerform);
			sendDiffsToSubscribers(getActionState(), diffsToPerform);
		},

		addReverseDiff: (fn) => {
			const result = fn(diffFactory);
			const diffsToAdd = Array.isArray(result) ? result : [result];
			reverseDiffs.push(...diffsToAdd);
		},
	};

	callback(params);
};

export const requestAction = (
	options: RequestActionOptions,
	callback: RequestActionCallback,
): void => {
	if (!getActionId()) {
		performRequestedAction(options, callback);
		return;
	}

	requestAnimationFrame(() => {
		if (!getActionId()) {
			performRequestedAction(options, callback);
			return;
		}
	});
};
