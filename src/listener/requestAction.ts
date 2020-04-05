import { store } from "~/state/store";
import { removeListener, addListener as _addListener } from "~/listener/addListener";
import { historyActions } from "~/state/history/historyActions";
import { getActionId, getActionState, getCurrentState } from "~/state/stateUtils";

let _n = 0;
let _activeRequestToken: null | string = null;

export const getActiveRequestToken = () => _activeRequestToken;

interface Options {
	history?: boolean;
	shouldAddToStack?: (prevState: ActionState, nextState: ActionState) => boolean;
}

export interface RequestActionCallback {
	(params: {
		dispatch: (action: any) => void;
		cancelAction: () => void;
		submitAction: (name: string) => void;
		addListener: typeof _addListener;
		execOnComplete: (callback: () => void) => void;
	}): void;
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
		dispatch: (action) => {
			store.dispatch(historyActions.dispatchToAction(actionId, action, history));
		},

		submitAction: (name: string) => {
			if (
				typeof shouldAddToStack === "function"
					? !shouldAddToStack(getCurrentState(), getActionState())
					: false
			) {
				store.dispatch(historyActions.cancelAction(actionId));
				onComplete();
				return;
			}

			store.dispatch(historyActions.submitAction(actionId, name, history));
			onComplete();
		},

		cancelAction: () => {
			store.dispatch(historyActions.cancelAction(actionId));
			onComplete();
		},

		addListener,

		execOnComplete: (cb) => {
			onCompleteCallback = cb;
		},
	});
};
