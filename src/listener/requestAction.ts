import { areaActions } from "~/area/state/areaActions";
import { addListener as _addListener, removeListener } from "~/listener/addListener";
import { historyActions } from "~/state/history/historyActions";
import { HistoryState } from "~/state/history/historyReducer";
import { getActionId, getActionState, getCurrentState } from "~/state/stateUtils";
import { store } from "~/state/store";

let _n = 0;
let _activeRequestToken: null | string = null;

export const getActiveRequestToken = (): null | string => _activeRequestToken;

interface Options {
	history?: boolean;
	shouldAddToStack?: (prevState: ActionState, nextState: ActionState) => boolean;
}

export interface RequestActionParams {
	dispatch: (action: any | any[], ...otherActions: any[]) => void;
	dispatchToAreaState: (areaId: string, action: any) => void;
	cancelAction: () => void;
	submitAction: (name?: string) => void;
	addListener: typeof _addListener;
	removeListener: typeof removeListener;
	execOnComplete: (callback: () => void) => void;
	cancelled: () => boolean;
}

export interface RequestActionCallback {
	(params: RequestActionParams): void;
}

const performRequestedAction = (
	{ history = false, shouldAddToStack }: Options,
	callback: RequestActionCallback,
): void => {
	const actionId = (++_n).toString();
	const cancelTokens: string[] = [];

	const addListener = Object.keys(_addListener).reduce<typeof _addListener>((obj, key) => {
		(obj as any)[key] = (...args: any[]) => {
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

	const escToken = addListener.keyboardOnce("Esc", "keydown", () => {
		store.dispatch(historyActions.cancelAction(actionId));
		onComplete();
	});
	cancelTokens.push(escToken);

	store.dispatch(historyActions.startAction(actionId));

	const dispatch: RequestActionParams["dispatch"] = (action, ...args) => {
		if (Array.isArray(action)) {
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

	callback({
		cancelled: () => actionId !== getActionId(),

		dispatch,

		dispatchToAreaState: (areaId, action) => {
			dispatch(areaActions.dispatchToAreaState(areaId, action));
		},

		submitAction: (name = "Unknown action") => {
			if (!getActionId()) {
				console.warn("Attempted to submit an action that does not exist.");
				return;
			}

			if (getActionId() !== actionId) {
				console.warn("Attempted to submit with the wrong action id.");
				return;
			}

			if (
				typeof shouldAddToStack === "function"
					? !shouldAddToStack(getCurrentState(), getActionState())
					: false
			) {
				store.dispatch(historyActions.cancelAction(actionId));
				onComplete();
				return;
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

			store.dispatch(historyActions.submitAction(actionId, name, history, modifiedKeys));
			onComplete();
		},

		cancelAction: () => {
			store.dispatch(historyActions.cancelAction(actionId));
			onComplete();
		},

		addListener,

		removeListener,

		execOnComplete: (cb) => {
			onCompleteCallback = cb;
		},
	});
};

export const requestAction = (options: Options, callback: RequestActionCallback): void => {
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
