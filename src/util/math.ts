export const interpolate = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export class Vec2 {
	public static new(vec: { x: number; y: number } | { left: number; top: number }): Vec2;
	public static new(x: number, y: number): Vec2;
	public static new(
		vecOrX: number | { x: number; y: number } | { left: number; top: number },
		y?: number,
	) {
		if (typeof vecOrX === "number") {
			return new Vec2(vecOrX, y!);
		}

		if (typeof (vecOrX as any).left === "number") {
			return new Vec2((vecOrX as any).left, (vecOrX as any).top);
		}

		return new Vec2((vecOrX as any).x, (vecOrX as any).y);
	}

	public static fromEvent(e: MouseEvent): Vec2 {
		return new Vec2(e.clientX, e.clientY);
	}

	public x: number;
	public y: number;

	constructor(vec: { x: number; y: number });
	constructor(x: number, y: number);
	constructor(vecOrX: number | { x: number; y: number }, y?: number) {
		if (typeof vecOrX === "number") {
			this.x = vecOrX;
			this.y = y!;
		} else {
			this.x = vecOrX.x;
			this.y = vecOrX.y;
		}
	}

	public add(vec: Vec2): Vec2 {
		return new Vec2(this.x + vec.x, this.y + vec.y);
	}

	public sub(vec: Vec2): Vec2 {
		return new Vec2(this.x - vec.x, this.y - vec.y);
	}

	/**
	 * Linear interpolation
	 *
	 * A `t` value of `0` is this vector, 1 is `vec`
	 */
	public lerp(vec: Vec2, t: number): Vec2 {
		return new Vec2(interpolate(this.x, vec.x, t), interpolate(this.y, vec.y, t));
	}
}

declare global {
	class Vec2 {
		public static new(vec: { x: number; y: number } | { left: number; top: number }): Vec2;
		public static new(x: number, y: number): Vec2;
		public static fromEvent(e: { clientX: number; clientY: number }): Vec2;

		public x: number;
		public y: number;

		constructor(vec: { x: number; y: number });
		constructor(x: number, y: number);

		public add(vec: Vec2): Vec2;
		public lerp(vec: Vec2, t: number): Vec2;
		public sub(vec: Vec2): Vec2;
		public lerp(vec: Vec2, t: number): Vec2;
	}
}

export const addVec2 = (a: { x: number; y: number }, b: { x: number; y: number }): Vec2 =>
	Vec2.new(a.x + b.x, a.y + b.y);

export const subVec2 = (a: { x: number; y: number }, b: { x: number; y: number }): Vec2 =>
	Vec2.new(a.x - b.x, a.y - b.y);

export const isVecInRect = (vec: Vec2, rect: Rect) =>
	vec.x >= rect.left &&
	vec.x <= rect.left + rect.width &&
	vec.y >= rect.top &&
	vec.y <= rect.top + rect.height;

export const panRect = (rect: Rect, vec: Vec2): Rect => ({
	left: rect.left + vec.x,
	top: rect.top + vec.y,
	width: rect.width,
	height: rect.height,
});

export const scaleRect = (rect: Rect, scale: number): Rect => ({
	left: rect.left,
	top: rect.top,
	width: rect.width * scale,
	height: rect.height * scale,
});

export const capToRange = (low: number, high: number, value: number) =>
	Math.min(high, Math.max(low, value));
