import { addListener } from "~/listener/addListener";
import { sendDiffsToSubscribers } from "~/listener/diffListener";
import { isKeyCodeOf, isKeyDown } from "~/listener/keyboard";
import { historyActions } from "~/state/history/historyActions";
import { getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";

const redo = () => {
	const state = store.getState();
	if (state.flowState.index === state.flowState.list.length - 1) {
		// Nothing to redo.
		return;
	}

	const nextIndex = state.flowState.index + 1;
	const nextActionState = getActionStateFromApplicationState(store.getState(), nextIndex);
	const next = state.flowState.list[nextIndex];
	store.dispatch(historyActions.moveHistoryIndex(nextIndex));
	sendDiffsToSubscribers(nextActionState, next.diffs, "forward");
};

const undo = () => {
	const state = store.getState();
	if (state.flowState.index === 0) {
		return;
	}

	const curr = state.flowState.list[state.flowState.index];
	const nextIndex = state.flowState.index - 1;
	const nextActionState = getActionStateFromApplicationState(store.getState(), nextIndex);
	store.dispatch(historyActions.moveHistoryIndex(nextIndex));
	sendDiffsToSubscribers(nextActionState, curr.diffs, "backward");
};

addListener.repeated("keydown", { modifierKeys: ["Command"] }, (e) => {
	if (!isKeyCodeOf("Z", e.keyCode)) {
		return;
	}

	e.preventDefault();

	if (isKeyDown("Shift")) {
		redo();
		return;
	}

	undo();
});

electron.registerUndo(undo);
electron.registerRedo(redo);
