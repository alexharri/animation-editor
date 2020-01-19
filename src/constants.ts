export const keys = {
	Backspace: 8,
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
