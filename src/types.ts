export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type CardinalDirection = "n" | "w" | "s" | "e";
export type IntercardinalDirection = "ne" | "nw" | "se" | "sw";

export enum NodeEditorNodeType {
	empty = "empty",

	num_input = "num_input",
	num_cap = "num_cap",
	num_lerp = "num_lerp",

	vec2_add = "vec2_add",
	vec2_lerp = "vec2_lerp",
	vec2_factors = "vec2_factors",
	vec2_input = "vec2_input",

	deg_to_rad = "deg_to_rad",
	rad_to_deg = "rad_to_deg",

	rect_translate = "rect_translate",

	expr = "expr",

	layer_transform_output = "layer_transform_output",
	layer_transform_input = "layer_transform_input",
}

export enum ValueType {
	Number = "number",
	Vec2 = "vec2",
	Rect = "rect",
	Any = "any",
}

export enum PropertyGroupName {
	Transform,
	Dimensions,
}

export enum PropertyName {
	// Transform Properties
	Scale,
	PositionX,
	PositionY,
	Rotation,
	Opacity,

	// Other Properties
	Width,
	Height,
}

export type Json = string | number | boolean | null | JsonObject | JsonArray | undefined;
export interface JsonArray extends Array<Json> {}
export interface JsonObject {
	[property: string]: Json;
}

export type KeySelectionMap = Partial<{ [key: string]: true }>;
