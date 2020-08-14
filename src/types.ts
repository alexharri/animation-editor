export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type CardinalDirection = "n" | "w" | "s" | "e";
export type IntercardinalDirection = "ne" | "nw" | "se" | "sw";

export type HSLColor = [number, number, number];
export type RGBColor = [number, number, number];
export type RGBAColor = [number, number, number, number];

export interface AffineTransform {
	translate: Vec2;
	anchor: Vec2;
	rotation: number; // Radians
	scale: number;
}

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

	array_modifier_index = "array_modifier_index",

	composition = "composition",
}

export enum ValueType {
	Number = "number",
	Vec2 = "vec2",
	Rect = "rect",
	Color = "color",
	TransformBehavior = "transform_behavior",
	ShapeReference = "shape_ref",
	Any = "any",
}

export enum ValueFormat {
	Percentage,
	Rotation,
}

export enum LayerType {
	Rect = 0,
	Ellipse = 1,
	Composition = 2,
	Shape = 3,
}

// Property group names start at 5000 so they don't overlap with property names.
// This allows us to find certain groups/properties like so:
//
//		property.name === PropertyName.X
//
// when the `property` may be either a Property or a PropertyGroup
export enum PropertyGroupName {
	Transform = 5000,
	Dimensions = 5001,
	Content = 5002,
	Structure = 5003,
	Modifiers = 5004,
	Shape = 5006,

	// Modifiers
	ArrayModifier = 5005,
}

export enum PropertyName {
	// Transform Properties
	AnchorX = 0,
	AnchorY = 1,
	Scale = 2,
	PositionX = 3,
	PositionY = 4,
	Rotation = 5,
	Opacity = 6,

	// Rect properties
	Width = 7,
	Height = 8,

	// Look properties
	Fill = 9,
	StrokeColor = 10,
	StrokeWidth = 11,
	BorderRadius = 12,

	// Ellipse properties
	OuterRadius = 13,
	InnerRadius = 14,

	// Array Modifier
	ArrayModifier_Count = 15,
	ArrayModifier_TransformBehavior = 16,

	// Shape Layer
	ShapeLayer_Path = 17,
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

export interface ArrayModifierPropertyValueMap {
	[propertyId: string]: { [index: number]: any };
}

export interface CompositionRenderValues {
	properties: PropertyValueMap;
	arrayModifierProperties: ArrayModifierPropertyValueMap;
	transforms: {
		[layerId: string]: {
			transform: { [index: number]: AffineTransform };
			indexTransforms: Array<{
				[index: number]: AffineTransform;
			}>;
		};
	};
	compositionLayers: {
		[layerId: string]: { [index: number]: CompositionRenderValues };
	};
	frameIndex: number;
	parent?: CompositionRenderValues;
}

export type TransformBehavior = "recursive" | "absolute_for_computed";
