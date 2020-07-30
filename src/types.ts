export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type CardinalDirection = "n" | "w" | "s" | "e";
export type IntercardinalDirection = "ne" | "nw" | "se" | "sw";

export type HSLColor = [number, number, number];
export type RGBColor = [number, number, number];
export type RGBAColor = [number, number, number, number];

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

	color_from_rgba_factors = "color_from_rgba_factors",
	color_to_rgba_factors = "color_to_rgba_factors",
	color_input = "color_input",

	property_output = "property_output",
	property_input = "property_input",

	composition = "composition",
}

export enum ValueType {
	Number = "number",
	Vec2 = "vec2",
	Rect = "rect",
	Color = "color",
	Any = "any",
}

export enum ValueFormat {
	Percentage,
	Rotation,
}

export enum PropertyGroupName {
	Transform,
	Dimensions,
	Content,
	Structure,
}

export enum LayerType {
	Rect,
	Ellipse,
	Composition,
}

export enum PropertyName {
	// Transform Properties
	AnchorX,
	AnchorY,
	Scale,
	PositionX,
	PositionY,
	Rotation,
	Opacity,

	// Rect properties
	Width,
	Height,

	// Look properties
	Fill,
	StrokeColor,
	StrokeWidth,
	BorderRadius,

	// Ellipse properties
	OuterRadius,
	InnerRadius,
}

export type Json = string | number | boolean | null | JsonObject | JsonArray | undefined;
export type JsonArray = Array<Json>;
export interface JsonObject {
	[property: string]: Json;
}

export type KeySelectionMap = Partial<{ [key: string]: true }>;

export interface PropertyValueMap {
	[propertyId: string]: {
		computedValue: any;
		rawValue: any;
	};
}

export interface AffineTransform {
	translate: Vec2;
	anchor: Vec2;
	rotation: number; // Radians
	scale: number;
}
