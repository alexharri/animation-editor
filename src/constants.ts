export const keys = {
	Backspace: 8,
	Tab: 9,
	Enter: 13,
	Shift: 16,
	Control: 17,
	Alt: 18,
	Esc: 27,
	Space: 32,
	Delete: 46,
	B: 66,
	C: 67,
	F: 70,
	I: 73,
	O: 79,
	P: 80,
	Q: 81,
	R: 82,
	S: 83,
	V: 86,
	X: 88,
	Z: 90,
	Command: 91,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,
};

export const modifierKeys: Array<keyof typeof keys> = ["Alt", "Command"];

export const AREA_BORDER_WIDTH = 2;
export const AREA_MIN_CONTENT_WIDTH = 32;

export const TOOLBAR_HEIGHT = 32;

export enum Tool {
	move,
	pen,
	editVertex,
	rectangle,
	ellipse,
	polygon,
	fill,
	intersection,
}

export const keyToToolMap: Partial<{ [key in keyof typeof keys]: Tool }> = {
	P: Tool.pen,
	V: Tool.move,
	O: Tool.ellipse,
	R: Tool.rectangle,
	I: Tool.intersection,
	F: Tool.fill,
};

export const toolToKey = Object.keys(keyToToolMap).reduce<Partial<{ [key: string]: string }>>(
	(obj, key) => {
		obj[(keyToToolMap as any)[key]] = key;
		return obj;
	},
	{},
);

export const toolToLabel = {
	[Tool.move]: "Selection",
	[Tool.rectangle]: "Rectangle",
	[Tool.polygon]: "Polygon",
	[Tool.pen]: "Pen",
	[Tool.intersection]: "Intersection",
	[Tool.fill]: "Fill",
	[Tool.ellipse]: "Ellipse",
	[Tool.editVertex]: "Edit Vertex",
};

export const toolGroups: Array<Array<{ tool: Tool }>> = [
	[{ tool: Tool.move }],
	[{ tool: Tool.pen }, { tool: Tool.editVertex }],
	[{ tool: Tool.rectangle }, { tool: Tool.ellipse }, { tool: Tool.polygon }],
	[{ tool: Tool.fill }, { tool: Tool.intersection }],
];

export enum AreaType {
	NodeEditor = "node_editor",
	Timeline = "composition_timeline",
	Workspace = "composition_workspace",
	History = "history",
	Project = "project",
}

export enum TimelineColors {
	XPosition = "#FF3434",
	YPosition = "#5BE719",
	Width = "#32E8E8",
	Height = "#EE30F2",
}

export const DEFAULT_NODE_EDITOR_NODE_WIDTH = 128;
export const NODE_EDITOR_MIN_NODE_WIDTH = 64;
export const NODE_EDITOR_EXPRESSION_NODE_MIN_TEXTAREA_HEIGHT = 24;
export const NODE_EDITOR_NODE_H_PADDING = 12;

export const DEFAULT_CONTEXT_MENU_WIDTH = 180;
export const CONTEXT_MENU_OPTION_HEIGHT = 20;
export const CONTEXT_MENU_OPTION_PADDING_LEFT = 32;
export const CONTEXT_MENU_OPTION_PADDING_RIGHT = 16;

export const DEG_TO_RAD_FAC = 0.0174533;
export const RAD_TO_DEG_FAC = 57.2958;

export const VIEW_BOUNDS_HANDLE_WIDTH = 8;

export const TIMELINE_CP_TX_MIN = 0.0001;
export const TIMELINE_CP_TX_MAX = 1 - TIMELINE_CP_TX_MIN;
export const TIMELINE_CANVAS_END_START_BUFFER = VIEW_BOUNDS_HANDLE_WIDTH;

export const TIMELINE_SCRUBBER_HEIGHT = 24;

export const TIMELINE_HEADER_HEIGHT = 32;
export const TIMELINE_TRACK_KEYFRAME_HEIGHT = 11;
export const TIMELINE_TRACK_START_END_X_MARGIN = 4;

export const TIMELINE_LAYER_HEIGHT = 16;
export const TIMELINE_BETWEEN_LAYERS = 1;
export const TIMELINE_ITEM_HEIGHT = TIMELINE_LAYER_HEIGHT + TIMELINE_BETWEEN_LAYERS;
export const TIMELINE_SEPARATOR_WIDTH = 2;

export const TRACKPAD_ZOOM_DELTA_FAC = 1 / 7;

export const EXPR_TEXTAREA_H_PADDING = 8;
export const EXPR_TEXTAREA_V_PADDING = 4;
export const EXPR_TEXTAREA_LINE_HEIGHT = 16;
export const EXPR_TEXTAREA_MIN_WIDTH = DEFAULT_NODE_EDITOR_NODE_WIDTH - EXPR_TEXTAREA_H_PADDING * 2;
export const EXPR_TEXTAREA_MIN_HEIGHT = EXPR_TEXTAREA_LINE_HEIGHT + EXPR_TEXTAREA_V_PADDING * 2;
export const EXPR_TEXTAREA_HEIGHT_BUFFER = 8;
