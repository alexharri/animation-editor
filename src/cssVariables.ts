import { TOOLBAR_HEIGHT } from "~/constants";

export const cssVariables = {
	primary300: "#2840bb",
	primary400: "#355dd4",
	primary500: "#3074f3",
	primary700: "#4babff",

	white500: "#f3f3f3",

	light500: "#adadad",
	light400: "#989898",
	light300: "#777",

	gray800: "#666",
	gray700: "#555",
	gray600: "#444",
	gray500: "#3d3d3d",

	dark700: "#333",
	dark600: "#272727",
	dark500: "#222",
	dark300: "#111",

	toolbarHeight: `${TOOLBAR_HEIGHT}px`,
	fontFamily: "'Open sans', sans-serif",
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
	timelineEditor: {
		panTarget: 50,
		zoomTarget: 55,
	},
	nodeEditor: {
		dragSelectPreview: 45,
		panTarget: 50,
		zoomTarget: 55,
		clickCaptureTarget: 60,
	},
	area: {
		areaBase: 5,
		separator: 10,
		cursorCapture: 15,
		areaRaised: 20,
		joinPreview: 25,
		areaToOpenTarget: 99,
		areaToOpen: 100,
	},
	toolbar: 100,
	contextMenuBackground: 500,
	contextMenu: 501,
};

export const cssMixins = {
	darkScrollbar: `
		scrollbar-color: ${cssVariables.gray500} ${cssVariables.dark500};
		scrollbar-width: thin;

		&::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}
		&::-webkit-scrollbar-track {
			background: ${cssVariables.dark500};
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb {
			background: ${cssVariables.gray500};
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb:hover {
			background: ${cssVariables.gray500};
		}
	`,
};
