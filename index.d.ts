declare type Ctx = CanvasRenderingContext2D;

declare interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

declare type CubicBezier = [Vec2, Vec2, Vec2, Vec2];
declare type PartialCubicBezier = [Vec2, Vec2 | null, Vec2 | null, Vec2]; // For easier typing
declare type Line = [Vec2, Vec2];
declare type Curve = CubicBezier | Line;

declare interface GlobalState {
	window: WindowState;
}

declare interface MapOf<T> {
	[key: string]: T;
}

declare module "svg-arc-to-cubic-bezier";
