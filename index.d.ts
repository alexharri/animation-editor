declare type Ctx = CanvasRenderingContext2D;

declare interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

declare interface GlobalState {
	window: WindowState;
}

declare interface MapOf<T> {
	[key: string]: T;
}
