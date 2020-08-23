import { TOOLBAR_HEIGHT } from "~/constants";

export const cssVariables = {
	primary300: "#2840bb",
	primary400: "#355dd4",
	primary500: "#3074f3",
	primary600: "#418dff",
	primary700: "#4babff",

	white500: "#f3f3f3",

	light500: "#adadad",
	light400: "#989898",
	light300: "#777",
	light200: "#676767",

	gray800: "#666",
	gray700: "#555",
	gray600: "#444",
	gray500: "#3d3d3d",
	gray400: "#353535",

	dark800: "#333",
	dark700: "#2d2d2d",
	dark600: "#272727",
	dark500: "#222",
	dark300: "#111",

	toolbarHeight: `${TOOLBAR_HEIGHT}px`,
	fontFamily: "'Open sans', sans-serif",
	fontMonospace: "'Roboto Mono', monospace",
};

export const cssCursors = {
	arrowBold: {
		up: `url("/static/cursors/arrow_n.png") 12 10, default`,
		left: `url("/static/cursors/arrow_w.png") 12 10, default`,
		right: `url("/static/cursors/arrow_e.png") 12 10, default`,
		down: `url("/static/cursors/arrow_s.png") 12 10, default`,
	},
	moveTool: {
		default: `url("/static/cursors/selection.png") 0 0, default`,
		moveSelection: `url("/static/cursors/selection_move.png") 0 0, default`,
	},
	penTool: {
		default: `url("/static/cursors/pen_default.png") 0 0, default`,
		moveSelection: `url("/static/cursors/selection_move.png") 0 0, default`,
		closePath: `url("/static/cursors/pen_select_point.png") 0 0, default`,
	},
	zoom: {
		zoomIn: `url("/static/cursors/zoom_in.png") 6 6, default`,
		zoomOut: `url("/static/cursors/zoom_out.png") 6 6, default`,
	},
	grab: {
		default: `url("/static/cursors/grab.png") 8 8, default`,
	},
};

export const cssZIndex = {
	graphEditor: {
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
	timeline: {
		scrubber: {
			interactionArea: 1,
			canvas: 2,
			head: 3,
		},
	},
	toolbar: 100,
	dragComp: 200,
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
