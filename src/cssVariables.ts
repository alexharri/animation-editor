import { TOOLBAR_HEIGHT } from "~/constants";

export const cssVariables = {
	primary400: "#2840bb",
	primary500: "#355dd4",
	gray500: "#666",
	gray400: "#3d3d3d",
	gray300: "#333",
	gray200: "#222",
	gray100: "#111",
	toolbarHeight: `${TOOLBAR_HEIGHT}px`,
};

export const cssCursors = {
	arrowBold: {
		up: `url("/static/cursors/arrow_n.png") 12 10, default`,
		left: `url("/static/cursors/arrow_w.png") 12 10, default`,
		right: `url("/static/cursors/arrow_e.png") 12 10, default`,
		down: `url("/static/cursors/arrow_s.png") 12 10, default`,
	},
};

export const cssZIndex = {
	area: {
		areaBase: 5,
		separator: 10,
		cursorCapture: 15,
		areaRaised: 20,
		joinPreview: 25,
	},
	toolbar: 100,
};
