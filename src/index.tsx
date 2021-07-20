import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { DiffType } from "~/diff/diffs";
import "~/globals";
import { addListener } from "~/listener/addListener";
import { sendDiffsToSubscribers } from "~/listener/diffListener";
import { isKeyCodeOf, isKeyDown } from "~/listener/keyboard";
import { historyActions } from "~/state/history/historyActions";
import { getActionState, getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { App } from "./App";

const Root = () => (
	<Provider store={store}>
		<App />
	</Provider>
);

ReactDOM.render(<Root />, document.getElementById("root") || document.body);

// Disable right click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

window.addEventListener("resize", () => {
	requestAnimationFrame(() => {
		sendDiffsToSubscribers(getActionState(), [{ type: DiffType.ResizeAreas }]);
	});
});

addListener.repeated("keydown", { modifierKeys: ["Command"] }, (e) => {
	if (!isKeyCodeOf("Z", e.keyCode)) {
		return;
	}

	e.preventDefault();

	const state = store.getState();
	if (isKeyDown("Shift")) {
		// Attempted redo

		if (state.flowState.index === state.flowState.list.length - 1) {
			// Nothing to redo.
			return;
		}

		const nextIndex = state.flowState.index + 1;
		const nextActionState = getActionStateFromApplicationState(store.getState(), nextIndex);
		const next = state.flowState.list[nextIndex];
		store.dispatch(historyActions.moveHistoryIndex(nextIndex));
		sendDiffsToSubscribers(nextActionState, next.diffs, "forward");
		return;
	}

	if (state.flowState.index > 0) {
		// Attempted undo
		const curr = state.flowState.list[state.flowState.index];
		const nextIndex = state.flowState.index - 1;
		const nextActionState = getActionStateFromApplicationState(store.getState(), nextIndex);
		store.dispatch(historyActions.moveHistoryIndex(nextIndex));
		sendDiffsToSubscribers(nextActionState, curr.diffs, "backward");
	}
});
