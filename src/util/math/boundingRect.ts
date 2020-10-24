/**
 * Based on https://stackoverflow.com/a/34882840/6875745
 */

import { boundingRectOfRects, rectOfTwoVecs } from "~/util/math";

export function cubicBezierBoundingRect(bezier: CubicBezier): Rect {
	const [p0, p1, p2, p3] = bezier;

	const x0 = p0.x;
	const y0 = p0.y;
	const x1 = p1.x;
	const y1 = p1.y;
	const x2 = p2.x;
	const y2 = p2.y;
	const x3 = p3.x;
	const y3 = p3.y;

	const tvalues: number[] = [];
	const xvalues: number[] = [];
	const yvalues: number[] = [];

	let a: number;
	let b: number;
	let c: number;
	let t: number;
	let t1: number;
	let t2: number;
	let b2ac: number;
	let sqrtb2ac: number;

	for (let i = 0; i < 2; i++) {
		if (i == 0) {
			b = 6 * x0 - 12 * x1 + 6 * x2;
			a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
			c = 3 * x1 - 3 * x0;
		} else {
			b = 6 * y0 - 12 * y1 + 6 * y2;
			a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
			c = 3 * y1 - 3 * y0;
		}
		if (Math.abs(a) < 1e-12) {
			if (Math.abs(b) < 1e-12) {
				continue;
			}
			t = -c / b;
			if (0 < t && t < 1) {
				tvalues.push(t);
			}
			continue;
		}
		b2ac = b * b - 4 * c * a;
		if (b2ac < 0) {
			if (Math.abs(b2ac) < 1e-12) {
				t = -b / (2 * a);
				if (0 < t && t < 1) {
					tvalues.push(t);
				}
			}
			continue;
		}
		sqrtb2ac = Math.sqrt(b2ac);
		t1 = (-b + sqrtb2ac) / (2 * a);
		if (0 < t1 && t1 < 1) {
			tvalues.push(t1);
		}
		t2 = (-b - sqrtb2ac) / (2 * a);
		if (0 < t2 && t2 < 1) {
			tvalues.push(t2);
		}
	}

	let j = tvalues.length;
	let mt: number;
	while (j--) {
		t = tvalues[j];
		mt = 1 - t;
		xvalues[j] =
			mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
		yvalues[j] =
			mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
	}

	xvalues.push(x0, x3);
	yvalues.push(y0, y3);

	const xmin = Math.min.apply(0, xvalues);
	const ymin = Math.min.apply(0, yvalues);
	const xmax = Math.max.apply(0, xvalues);
	const ymax = Math.max.apply(0, yvalues);

	const rect: Rect = {
		left: xmin,
		top: ymin,
		width: xmax - xmin,
		height: ymax - ymin,
	};
	return rect;
}

function lineBoundingRect(line: Line) {
	return rectOfTwoVecs(line[0], line[1]);
}

export function curveBoundingRect(curve: Curve) {
	if (curve.length === 2) {
		return lineBoundingRect(curve);
	}
	return cubicBezierBoundingRect(curve);
}

export function pathControlPointsBoundingRect(curves: Curve[]) {
	const xvalues: number[] = [];
	const yvalues: number[] = [];

	for (const curve of curves) {
		for (const p of curve) {
			xvalues.push(p.x);
			yvalues.push(p.y);
		}
	}

	const xmin = Math.min.apply(0, xvalues);
	const ymin = Math.min.apply(0, yvalues);
	const xmax = Math.max.apply(0, xvalues);
	const ymax = Math.max.apply(0, yvalues);

	const rect: Rect = {
		left: xmin,
		top: ymin,
		width: xmax - xmin,
		height: ymax - ymin,
	};
	return rect;
}

export function pathBoundingRect(curves: Curve[]): Rect | null {
	const rects = curves.map((curve) => curveBoundingRect(curve));
	return boundingRectOfRects(rects);
}
