/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-misused-new */

import { getDistance, interpolate, rotateVec2CCW } from "~/util/math";
import { Mat2 } from "~/util/math/mat";

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
	public static ORIGIN = Vec2.new(0, 0);

	private _x: number;
	private _y: number;
	private atOrigin: boolean;

	constructor(vec: { x: number; y: number });
	constructor(x: number, y: number);
	constructor(vecOrX: number | { x: number; y: number }, y?: number) {
		if (typeof vecOrX === "number") {
			this._x = vecOrX;
			this._y = y!;
		} else {
			this._x = vecOrX.x;
			this._y = vecOrX.y;
		}
		this.atOrigin = this.x === 0 && this.y === 0;
	}

	set x(value: number) {
		this._x = value;
		this.atOrigin = this.x === 0 && this.y === 0;
	}
	get x() {
		return this._x;
	}
	set y(value: number) {
		this._y = value;
		this.atOrigin = this.x === 0 && this.y === 0;
	}
	get y() {
		return this._y;
	}

	public add(vec: Vec2): Vec2 {
		if (vec.atOrigin) {
			return this;
		}

		return new Vec2(this.x + vec.x, this.y + vec.y);
	}

	public addX(x: number): Vec2 {
		return new Vec2(this.x + x, this.y);
	}

	public addY(y: number): Vec2 {
		return new Vec2(this.x, this.y + y);
	}

	public sub(vec: Vec2): Vec2 {
		if (vec.atOrigin) {
			return this;
		}

		return new Vec2(this.x - vec.x, this.y - vec.y);
	}

	public subX(x: number): Vec2 {
		return new Vec2(this.x - x, this.y);
	}

	public subY(y: number): Vec2 {
		return new Vec2(this.x, this.y - y);
	}

	public subXY(x: number, y: number): Vec2 {
		return new Vec2(this.x - x, this.y - y);
	}

	public scale(scale: number, anchor = Vec2.new(0, 0)): Vec2 {
		if (scale === 1) {
			return this;
		}

		return new Vec2(
			anchor.x + (this.x - anchor.x) * scale,
			anchor.y + (this.y - anchor.y) * scale,
		);
	}

	public scaleX(scale: number, anchor = Vec2.new(0, 0)): Vec2 {
		if (scale === 1) {
			return this;
		}

		return new Vec2(anchor.x + (this.x - anchor.x) * scale, this.y);
	}

	public scaleY(scale: number, anchor = Vec2.new(0, 0)): Vec2 {
		if (scale === 1) {
			return this;
		}

		return new Vec2(this.x, anchor.y + (this.y - anchor.y) * scale);
	}

	public scaleXY(scaleX: number, scaleY: number, anchor = Vec2.new(0, 0)): Vec2 {
		if (scaleX === 1 && scaleY === 1) {
			return this;
		}

		return new Vec2(
			anchor.x + (this.x - anchor.x) * scaleX,
			anchor.y + (this.y - anchor.y) * scaleY,
		);
	}

	public rotate(rad: number, anchor = Vec2.new(0, 0)): Vec2 {
		return rotateVec2CCW(this, rad, anchor) as Vec2;
	}

	public multiplyMat2(mat2: Mat2, anchor = Vec2.new(0, 0)): Vec2 {
		return mat2.multiplyVec2(this.sub(anchor)).add(anchor) as Vec2;
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

	public length(): number {
		return getDistance(Vec2.ORIGIN, this);
	}

	public eq(vec: Vec2): boolean {
		return vec.x === this.x && vec.y === this.y;
	}

	// @ts-ignore
	private toJSON() {
		return {
			x: this.x,
			y: this.y,
			__objectType: "vec2",
		};
	}
}

declare global {
	class Vec2 {
		public static new(vec: { x: number; y: number } | { left: number; top: number }): Vec2;
		public static new(x: number, y: number): Vec2;
		public static fromEvent(e: { clientX: number; clientY: number }): Vec2;
		public static ORIGIN: Vec2;

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
		public subXY(x: number, y: number): Vec2;
		public scale(scale: number, anchor?: Vec2): Vec2;
		public scaleX(scale: number, anchor?: Vec2): Vec2;
		public scaleY(scale: number, anchor?: Vec2): Vec2;
		public scaleXY(scaleX: number, scaleY: number, anchor?: Vec2): Vec2;
		public rotate(rad: number, anchor?: Vec2): Vec2;
		public multiplyMat2(mat2: Mat2, anchor?: Vec2): Vec2;
		public copy(): Vec2;
		public round(): Vec2;
		public apply(fn: (vec2: Vec2) => Vec2): Vec2;
		public length(): number;
		public eq(vec: Vec2): boolean;
	}
}
