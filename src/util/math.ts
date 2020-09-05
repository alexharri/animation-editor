import { intersectInfiniteLines } from "~/util/math/intersection/intersectInfiniteLines";
import { Mat2 } from "~/util/math/mat";

export const interpolate = (a: number, b: number, t: number) => a * (1 - t) + b * t;

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

export const rectOfVecs = (vecs: Vec2[]): Rect => {
	let xMin = Infinity;
	let xMax = -Infinity;
	let yMin = Infinity;
	let yMax = -Infinity;

	for (const vec of vecs) {
		if (vec.x > xMax) {
			xMax = vec.x;
		}
		if (vec.x < xMin) {
			xMin = vec.x;
		}

		if (vec.y > yMax) {
			yMax = vec.y;
		}
		if (vec.y < yMin) {
			yMin = vec.y;
		}
	}

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

/**
 * @param value - The value to interpolate
 * @param rangeMin - Left side of viewport
 * @param rangeMax - Right side of viewport
 * @param viewportWidth - Width of the viewport (canvas)
 */
export const translateToRange = (
	value: number,
	rangeMin: number,
	rangeMax: number,
	viewportWidth: number,
) => {
	const diff = rangeMax - rangeMin;
	const cutoff = rangeMax - diff;

	return interpolate(0, viewportWidth, (value - cutoff) / diff);
};

/**
 * @param vec - Vec2 to rotate
 * @param angle - Angle to rotate CCW in radians
 * @param anchor - `vec` is rotated around the anchor
 */
export function rotateVec2CCW(vec: Vec2, angle: number, anchor = Vec2.new(0, 0)): Vec2 {
	if (angle === 0) {
		return vec;
	}

	const x = vec.x - anchor.x;
	const y = vec.y - anchor.y;
	return Mat2.rotation(angle).multiplyVec2(Vec2.new(x, y)).add(anchor);
}

export const positiveAngleRadians = (angle: number) => {
	if (angle >= 0) {
		return angle;
	}
	return Math.PI * 2 - Math.abs(angle);
};

export function getAngleRadians(from: Vec2, to: Vec2): number {
	const vec = to.sub(from);
	const angle = Math.atan2(vec.y, vec.x);
	return angle;
}
export function getAngleRadiansPositive(from: Vec2, to: Vec2): number {
	const vec = to.sub(from);
	const angle = Math.atan2(vec.y, vec.x);
	return positiveAngleRadians(angle);
}

export function rotateVecToAngleRadians(vec: Vec2, targetAngle: number): Vec2 {
	const angle = getAngleRadians(Vec2.new(0, 0), vec);
	const diff = Math.abs(angle - targetAngle);
	return rotateVec2CCW(vec, diff);
}

export const projectVecToAngle = (vec: Vec2, angle: number): Vec2 => {
	if (vec.x === 0 && vec.y === 0) {
		return vec;
	}

	const rotmat = Mat2.rotation(angle);
	const perpmat = Mat2.rotation(angle + Math.PI / 2);

	const fromOrigin: Line = [Vec2.new(0, 0), rotmat.multiplyVec2(Vec2.new(1, 0))];
	const fromVec: Line = [vec.add(perpmat.i()), vec.add(perpmat.i().scale(-1))];

	const result = intersectInfiniteLines(fromOrigin, fromVec);
	return Vec2.new(result.x, result.y);
};

export const projectVecTo45DegAngle = (vec: Vec2): Vec2 => {
	const angleRad = getAngleRadians(Vec2.new(0, 0), vec);
	const tick = (Math.PI * 2) / 8;
	const angle = Math.round(angleRad / tick) * tick;
	return projectVecToAngle(vec, angle);
};

export const translateRect = (rect: Rect, translationVector: Vec2): Rect => {
	return {
		width: rect.width,
		height: rect.height,
		left: rect.left + translationVector.x,
		top: rect.top + translationVector.y,
	};
};

export const translateRectAsVec = (rect: Rect, transformFn: (vec: Vec2) => Vec2): Rect => {
	const { x: left, y: top } = transformFn(Vec2.new(rect.left, rect.top));
	const v0 = transformFn(Vec2.new(0, 0));
	const v1 = transformFn(Vec2.new(1, 1));
	let { x: wt, y: ht } = v1.sub(v0);
	const width = rect.width * wt;
	const height = rect.height * ht;
	return { left, top, width, height };
};

export const contractRect = (rect: Rect, contractBy: number): Rect => {
	return {
		left: rect.left + contractBy,
		top: rect.top + contractBy,
		width: rect.width - contractBy * 2,
		height: rect.height - contractBy * 2,
	};
};

export const expandRect = (rect: Rect, expandBy: number): Rect => contractRect(rect, expandBy * -1);

export const splitRect = (
	type: "horizontal" | "vertical",
	rect: Rect,
	t: number,
	margin = 0,
): [Rect, Rect] => {
	if (type === "horizontal") {
		const w = rect.width - margin;
		const lw = w * t;
		const rw = w * (1 - t);
		return [
			{
				left: rect.left,
				height: rect.height,
				width: lw,
				top: rect.top,
			},
			{
				left: rect.left + lw + margin,
				height: rect.height,
				width: rw,
				top: rect.top,
			},
		];
	}

	const h = rect.height - margin;
	const th = h * t;
	const bh = h * (1 - t);
	return [
		{
			top: rect.top,
			height: th,
			width: rect.width,
			left: rect.left,
		},
		{
			top: rect.top + th + margin,
			height: bh,
			width: rect.width,
			left: rect.left,
		},
	];
};

export const valueWithinMargin = (value: number, at: number, margin: number): boolean => {
	return value >= at - margin && value <= at + margin;
};

export const valueWithinRange = (value: number, min: number, max: number): boolean => {
	return value >= min && value <= max;
};

export const distanceFromTranslatedX = (
	a: number,
	b: number,
	translate: (value: number) => number,
): number => {
	const [x0, x1] = [0, 1].map((value) => translate(value));

	const xt = x1 - x0;

	const aScaled = a * (1 / xt);
	const bScaled = b * (1 / xt);
	return Math.abs(aScaled - bScaled);
};

export const isVecInPoly = (vec: Vec2, poly: Vec2[]) => {
	const { x, y } = vec;

	let inside = false;

	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const intersect =
			poly[i].y > y !== poly[j].y > y &&
			x < ((poly[j].x - poly[i].x) * (y - poly[i].y)) / (poly[j].y - poly[i].y) + poly[i].x;
		if (intersect) {
			inside = !inside;
		}
	}

	return inside;
};

function _quadraticToCubicBezierCalcP2(p3: Vec2, p1: Vec2): Vec2 {
	return Vec2.new(p1.x + (p3.x - p1.x) * 0.4, p1.y + (p3.y - p1.y) * 0.4);
}

export function quadraticToCubicBezier(
	p0: Vec2,
	p1: Vec2 | null,
	p2: Vec2 | null,
	p3: Vec2,
): CubicBezier {
	if (p1 === null) {
		const newP1 = _quadraticToCubicBezierCalcP2(p2!, p0);
		return [p0, newP1, p2!, p3];
	} else {
		const newP2 = _quadraticToCubicBezierCalcP2(p1!, p3);
		return [p0, p1, newP2, p3];
	}
}
