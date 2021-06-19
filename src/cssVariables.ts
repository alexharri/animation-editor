import { TOOLBAR_HEIGHT } from "~/constants";

export const cssVariables = {
	primary300: "#2840bb",
	primary400: "#355dd4",
	primary500: "#3074f3",
	primary600: "#418dff",
	primary700: "#4babff",

	red300: "#B4281E",
	red500: "#c21f13",

	white500: "#f3f3f3",

	light500: "#adadad",
	light400: "#989898",
	light300: "#777",
	light200: "#676767",

	gray800: "#666666",
	gray700: "#555555",
	gray600: "#444444",
	gray500: "#3d3d3d",
	gray400: "#353535",

	dark800: "#333333",
	dark700: "#2d2d2d",
	dark600: "#272727",
	dark500: "#222222",
	dark400: "#191919",
	dark300: "#111111",

	toolbarHeight: `${TOOLBAR_HEIGHT}px`,
	fontFamily: "'Open sans', sans-serif",
	fontMonospace: "'Source Code Pro', monospace",
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
		addPoint: `url("/static/cursors/pen_add.png") 0 0, default`,
		removePoint: `url("/static/cursors/pen_remove.png") 0 0, default`,
		moveSelection: `url("/static/cursors/selection_move.png") 0 0, default`,
		closePath: `url("/static/cursors/pen_select_point.png") 0 0, default`,
		convertAnchor: `url("/static/cursors/convert_anchor.png") 0 0, default`,
		newControlPoints: `url("/static/cursors/new_control_points.png") 0 0, default`,
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
	flowEditor: {
		connections: 500,
		nodes: 1000,
		dragSelectPreview: 1010,
		panTarget: 2000,
		zoomTarget: 2010,
		clickCaptureTarget: 2020,
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
