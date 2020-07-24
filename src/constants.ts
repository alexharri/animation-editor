export const keys = {
	Backspace: 8,
	Tab: 9,
	Enter: 13,
	Shift: 16,
	Control: 17,
	Alt: 18,
	Esc: 27,
	Space: 32,
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
};

export const modifierKeys: Array<keyof typeof keys> = ["Alt", "Command"];

export const AREA_BORDER_WIDTH = 2;
export const AREA_MIN_CONTENT_WIDTH = 32;

export const TOOLBAR_HEIGHT = 32;

export enum Tool {
	selection,
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
	V: Tool.selection,
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
	[Tool.selection]: "Selection",
	[Tool.rectangle]: "Rectangle",
	[Tool.polygon]: "Polygon",
	[Tool.pen]: "Pen",
	[Tool.intersection]: "Intersection",
	[Tool.fill]: "Fill",
	[Tool.ellipse]: "Ellipse",
	[Tool.editVertex]: "Edit Vertex",
};

export const toolGroups: Array<Array<{ tool: Tool }>> = [
	[{ tool: Tool.selection }],
	[{ tool: Tool.pen }, { tool: Tool.editVertex }],
	[{ tool: Tool.rectangle }, { tool: Tool.ellipse }, { tool: Tool.polygon }],
	[{ tool: Tool.fill }, { tool: Tool.intersection }],
];

export enum AreaType {
	VectorEditor = "vector_editor",
	NodeEditor = "node_editor",
	CompositionTimeline = "composition_timeline",
	CompositionWorkspace = "composition_workspace",
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

export const DEG_TO_RAD_FAC = 0.0174533;
export const RAD_TO_DEG_FAC = 57.2958;

export const VIEW_BOUNDS_HANDLE_WIDTH = 8;

export const TIMELINE_CP_TX_MIN = 0.0001;
export const TIMELINE_CP_TX_MAX = 1 - TIMELINE_CP_TX_MIN;
export const TIMELINE_CANVAS_END_START_BUFFER = VIEW_BOUNDS_HANDLE_WIDTH;

export const COMP_TIME_SCRUBBER_HEIGHT = 24;

export const COMP_TIME_TRACK_KEYFRAME_HEIGHT = 11;
export const COMP_TIME_TRACK_START_END_X_MARGIN = 4;

export const COMP_TIME_LAYER_HEIGHT = 16;
export const COMP_TIME_BETWEEN_LAYERS = 1;
export const COMP_TIME_SEPARATOR_WIDTH = 2;
