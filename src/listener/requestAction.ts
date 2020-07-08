import { store } from "~/state/store";
import { removeListener, addListener as _addListener } from "~/listener/addListener";
import { historyActions } from "~/state/history/historyActions";
import { getActionId, getActionState, getCurrentState } from "~/state/stateUtils";
import { HistoryState } from "~/state/history/historyReducer";

let _n = 0;
let _activeRequestToken: null | string = null;

export const getActiveRequestToken = () => _activeRequestToken;

interface Options {
	history?: boolean;
	shouldAddToStack?: (prevState: ActionState, nextState: ActionState) => boolean;
}

export interface RequestActionParams {
	dispatch: (action: any | any[], ...otherActions: any[]) => void;
	cancelAction: () => void;
	submitAction: (name?: string) => void;
	addListener: typeof _addListener;
	removeListener: typeof removeListener;
	execOnComplete: (callback: () => void) => void;
}

export interface RequestActionCallback {
	(params: RequestActionParams): void;
}

export const requestAction = (
	{ history = false, shouldAddToStack }: Options,
	callback: RequestActionCallback,
) => {
	if (getActionId()) {
		return;
	}

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

	callback({
		dispatch: (action, ...args) => {
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
		},

		submitAction: (name = "Unknown action") => {
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
