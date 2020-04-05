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

	public addX(x: number): Vec2 {
		return new Vec2(this.x + x, this.y);
	}

	public addY(y: number): Vec2 {
		return new Vec2(this.x, this.y + y);
	}

	public sub(vec: Vec2): Vec2 {
		return new Vec2(this.x - vec.x, this.y - vec.y);
	}

	public scale(scale: number): Vec2 {
		return new Vec2(this.x * scale, this.y * scale);
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
		public scale(scale: number): Vec2;
		public round(): Vec2;
		public lerp(vec: Vec2, t: number): Vec2;
		public apply(fn: (vec2: Vec2) => Vec2): Vec2;
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

export function getDistance(a: Vec2, b: Vec2) {
	return Math.hypot(b.x - a.x, b.y - a.y);
}

export const rectOfTwoVecs = (a: Vec2, b: Vec2): Rect => {
	const xMin = Math.min(a.x, b.x);
	const xMax = Math.max(a.x, b.x);
	const yMin = Math.min(a.y, b.y);
	const yMax = Math.max(a.y, b.y);
	return {
		height: yMax - yMin,
		width: xMax - xMin,
		left: xMin,
		top: yMin,
	};
};

export const sortRectTopLeft = (a: Rect, b: Rect, acceptableVariance = 0): number => {
	return Math.abs(a.top - b.top) <= acceptableVariance ? a.left - b.left : a.top - b.top;
};

export const sortVecTopLeft = (a: Vec2, b: Vec2, acceptableVariance = 0): number => {
	return Math.abs(a.y - b.y) <= acceptableVariance ? a.x - b.x : a.y - b.y;
};

export const rectsIntersect = (a: Rect, b: Rect): boolean => {
	// If one rect is on the left of the other
	if (a.left > b.left + b.width || b.left > a.left + a.width) {
		return false;
	}

	// If one rect is above the other
	if (a.top > b.top + b.height || b.top > a.top + a.height) {
		return false;
	}

	return true;
};

export const boundingRect = (rects: Rect[]): Rect =>
	rects.slice(1).reduce<Rect>((a, b) => {
		const xMin = Math.min(a.left, b.left);
		const yMin = Math.min(a.top, b.top);
		return {
			left: xMin,
			top: yMin,
			height: Math.max(a.top + a.height, b.top + b.height) - yMin,
			width: Math.max(a.left + a.width, b.left + b.width) - xMin,
		};
	}, rects[0]);
