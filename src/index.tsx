import "~/globals";

import React from "react";
import ReactDOM from "react-dom";

import { App } from "~/App";

ReactDOM.render(<App />, document.getElementById("root"));

// Disable right click context menu

document.addEventListener("contextmenu", e => e.preventDefault(), false);
