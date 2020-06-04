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
export function rotateVec2CCW(vec: Vec2, angle: number, anchor = { x: 0, y: 0 }): Vec2 {
	const sin = Math.sin(angle);
	const cos = Math.cos(angle);

	const newVec = vec.copy();

	newVec.x -= anchor.x;
	newVec.y -= anchor.y;

	const newX = newVec.x * cos - newVec.y * sin;
	const newY = newVec.x * sin + newVec.y * cos;

	newVec.x = newX + anchor.x;
	newVec.y = newY + anchor.y;

	return newVec;
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
