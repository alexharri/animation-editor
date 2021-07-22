import { keys } from "~/constants";
import { DiffFactoryFn } from "~/diff/diffFactory";
import { Key } from "~/listener/keyboard";
import { RequestActionParams } from "~/listener/requestAction";
import { Mat2 } from "~/util/math/mat";

export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

export type Action = { type: string; payload: any };
export type ToDispatch = Action[];

export interface Operation {
	add: (...actions: Action[]) => void;
	clear: () => void;
	addDiff: (fn: DiffFactoryFn) => void;
	performDiff: (fn: DiffFactoryFn) => void;
	submit: () => void;
	state: ActionState;
}

export type CardinalDirection = "n" | "w" | "s" | "e";
export type IntercardinalDirection = "ne" | "nw" | "se" | "sw";

export type HSLColor = [number, number, number];
export type RGBColor = [number, number, number];
export type RGBAColor = [number, number, number, number];

export interface LayerTransform {
	origin: Vec2;
	originBehavior: OriginBehavior;
	translate: Vec2;
	anchor: Vec2;
	rotation: number; // Radians
	scaleX: number;
	scaleY: number;
	matrix: Mat2;
}

export enum ValueType {
	Number = "number",
	Vec2 = "vec2",
	Rect = "rect",
	RGBAColor = "rgba",
	RGBColor = "rgb",
	TransformBehavior = "transform_behavior",
	OriginBehavior = "origin_behavior",
	Path = "path",
	FillRule = "fill_rule",
	LineCap = "line_cap",
	LineJoin = "line_join",
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
	Line = 4,
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
	Fill = 5007,
	Stroke = 5008,

	// Modifiers
	ArrayModifier = 5005,
}

export enum CompoundPropertyName {
	Anchor = 1000,
	Scale = 1001,
	Position = 1002,
	ArrayModifier_Origin = 1003,
}

export enum PropertyName {
	// Transform Properties
	AnchorX = 0,
	AnchorY = 1,
	Scale = 2,
	ScaleX = 24,
	ScaleY = 25,
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
	RGBAColor = 18,
	RGBColor = 23,

	// Ellipse properties
	OuterRadius = 13,
	InnerRadius = 14,

	// Array Modifier
	ArrayModifier_Count = 15,
	ArrayModifier_TransformBehavior = 16,
	ArrayModifier_RotationCorrection = 26,
	ArrayModifier_OriginX = 27,
	ArrayModifier_OriginY = 28,
	ArrayModifier_OriginBehavior = 29,

	// Shape Layer
	ShapeLayer_Path = 17,
	FillRule = 19,
	LineCap = 20,
	LineJoin = 21,
	MiterLimit = 22,
}

export type TransformPropertyName =
	| PropertyName.PositionX
	| PropertyName.PositionY
	| PropertyName.AnchorX
	| PropertyName.AnchorY
	| PropertyName.ScaleX
	| PropertyName.ScaleY
	| PropertyName.Rotation;

export const TRANSFORM_PROPERTY_NAMES = [
	PropertyName.PositionX,
	PropertyName.PositionY,
	PropertyName.AnchorX,
	PropertyName.AnchorY,
	PropertyName.ScaleX,
	PropertyName.ScaleY,
	PropertyName.Rotation,
] as const;

export type Json = string | number | boolean | null | JsonObject | JsonArray | undefined;
export type JsonArray = Array<Json>;
export interface JsonObject {
	[property: string]: Json;
}

export type KeySelectionMap = Partial<{ [key: string]: true }>;

export type TransformBehavior = "recursive" | "absolute_for_computed";
export type OriginBehavior = "relative" | "absolute";
export type FillRule = "evenodd" | "nonzero";
export type LineCap = "butt" | "round" | "square";
export type LineJoin = "miter" | "round" | "bevel";

export interface MousePosition {
	global: Vec2;
	viewport: Vec2;
	normal: Vec2;
}

export type ShortcutFn = (areaId: string, params: RequestActionParams) => void;
export type ShouldAddShortcutToStackFn = (
	areaId: string,
	prevState: ActionState,
	nextState: ActionState,
) => boolean;
export interface KeyboardShortcut {
	name: string;
	key: keyof typeof keys;
	modifierKeys?: Array<"Command" | "Alt" | "Shift">;
	optionalModifierKeys?: Array<"Command" | "Alt" | "Shift">;
	fn: ShortcutFn;
	history?: boolean;
	shouldAddToStack?: ShouldAddShortcutToStackFn;
}

export type LayerParentPickWhip = { fromId: string; to: Vec2 };

export enum Performable {
	DrawLayer,
	UpdatePosition,
	UpdateTransform,
	UpdateArrayModifierTransform,
	UpdateArrayModifierCount,
}

export type KeyDownMap<K extends Key> = Record<K, boolean>;

export type LayerDimension =
	| {
			type: "array" | "parent";
			count: number;
			matrix: PIXI.Matrix;
	  }
	| {
			type: "array_with_graph";
			count: number;
			matrix: PIXI.Matrix;
			absoluteMatrices: PIXI.Matrix[];
	  }
	| {
			type: "array_with_graph_recursive";
			count: number;
			matrices: PIXI.Matrix[];
	  };

interface _ErrorBase {
	error: Error;
}

export enum CompositionErrorType {
	FlowNode,
	General,
}

interface IFlowNodeError extends _ErrorBase {
	type: CompositionErrorType.FlowNode;
	graphId: string;
	nodeId: string;
}

interface IGeneralError extends _ErrorBase {
	type: CompositionErrorType.General;
}

export type CompositionError = IFlowNodeError | IGeneralError;
