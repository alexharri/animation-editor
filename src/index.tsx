import * as PIXI from "pixi.js";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { DiffType } from "~/diff/diffs";
import "~/globals";
import { sendDiffsToSubscribers } from "~/listener/diffListener";
import { getActionState } from "~/state/stateUtils";
import { store } from "~/state/store";
import "~/state/undoRedo";
import { App } from "./App";

// If unsafe-eval is present in CSP, this can be used to fix that.
//
// import { install } from "@pixi/unsafe-eval";
// install(PIXI);

PIXI.utils.skipHello();

const Root = () => (
	<Provider store={store}>
		<App />
	</Provider>
);

ReactDOM.render(<Root />, document.getElementById("root"));

// Disable right click context menu
document.addEventListener("contextmenu", (e) => e.preventDefault(), false);

window.addEventListener("resize", () => {
	requestAnimationFrame(() => {
		sendDiffsToSubscribers(getActionState(), [{ type: DiffType.ResizeAreas }]);
	});
});
