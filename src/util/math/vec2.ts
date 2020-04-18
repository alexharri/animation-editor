import { interpolate } from "~/util/math";

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

	public addX(x: number): Vec2 {
		return new Vec2(this.x + x, this.y);
	}

	public addY(y: number): Vec2 {
		return new Vec2(this.x, this.y + y);
	}

	public sub(vec: Vec2): Vec2 {
		return new Vec2(this.x - vec.x, this.y - vec.y);
	}

	public subX(x: number): Vec2 {
		return new Vec2(this.x - x, this.y);
	}

	public subY(y: number): Vec2 {
		return new Vec2(this.x, this.y - y);
	}

	public scale(scale: number): Vec2 {
		return new Vec2(this.x * scale, this.y * scale);
	}

	public scaleX(scale: number): Vec2 {
		return new Vec2(this.x * scale, this.y);
	}

	public scaleY(scale: number): Vec2 {
		return new Vec2(this.x, this.y * scale);
	}

	public copy(): Vec2 {
		return new Vec2(this.x, this.y);
	}

	/**
	 * Linear interpolation
	 *
	 * A `t` value of `0` is this vector, 1 is `vec`
	 */
	public lerp(vec: Vec2, t: number): Vec2 {
		return new Vec2(interpolate(this.x, vec.x, t), interpolate(this.y, vec.y, t));
	}

	public round(): Vec2 {
		return Vec2.new(Math.round(this.x), Math.round(this.y));
	}

	public apply(fn: (vec: Vec2) => Vec2): Vec2 {
		return fn(this);
	}

	// @ts-ignore
	private toJSON(): string {
		return JSON.stringify({
			x: this.x,
			y: this.y,
			__objectType: "vec2",
		});
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
		public addX(x: number): Vec2;
		public addY(y: number): Vec2;
		public lerp(vec: Vec2, t: number): Vec2;
		public sub(vec: Vec2): Vec2;
		public subX(x: number): Vec2;
		public subY(y: number): Vec2;
		public scale(scale: number): Vec2;
		public scaleX(scale: number): Vec2;
		public scaleY(scale: number): Vec2;
		public copy(): Vec2;
		public round(): Vec2;
		public apply(fn: (vec2: Vec2) => Vec2): Vec2;
	}
}
