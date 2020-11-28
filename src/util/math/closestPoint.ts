/**
 * From https://stackoverflow.com/a/44993719
 */

import { getDistance } from "~/util/math";

export const closestPointOnPath = (
	path: Line | CubicBezier,
	vec: Vec2,
): { t: number; point: Vec2 } => {
	if (path.length === 2) {
		return closestPointOnLine(path, vec);
	}
	return closestPointOnCubicBezier(path, vec);
};

const closestPointOnLine = ([a, b]: Line, vec: Vec2): { t: number; point: Vec2 } => {
	const a_to_p: [number, number] = [vec.x - a.x, vec.y - a.y];
	const a_to_b: [number, number] = [b.x - a.x, b.y - a.y];
	const atb2 = a_to_b[0] ** 2 + a_to_b[1] ** 2;
	const atp_dot_atb = a_to_p[0] * a_to_b[0] + a_to_p[1] * a_to_b[1];
	const t = Math.min(1, Math.max(0, atp_dot_atb / atb2));
	const point = Vec2.new(a.x + a_to_b[0] * t, a.y + a_to_b[1] * t);
	return { point, t };
};

const closestPointOnCubicBezier = (bezier: CubicBezier, vec: Vec2) => {
	const { out, localMinimum } = _closestPointOnBezier(bezier, vec);
	return { point: out, t: localMinimum as number };
};

/* eslint-disable */

/** Find the ~closest point on a Bézier curve to a point you supply.
 * curve  : Array of vectors representing control points for a Bézier curve
 * pt     : The point (vector) you want to find out to be near
 * tmps   : Array of temporary vectors (reduces memory allocations)
 * returns: The parameter t representing the location of `out`
 */
function _closestPointOnBezier(bezier: CubicBezier, vec: Vec2): { out: Vec2; localMinimum: any } {
	const out = Vec2.new(0, 0);
	let mindex!: number;
	let scans = 25; // More scans -> better chance of being correct
	for (let min = Infinity, i = scans + 1; i--; ) {
		let d2 = getDistance(vec, bezierPoint(out, bezier, i / scans));
		if (d2 < min) {
			min = d2;
			mindex = i;
		}
	}
	const t0 = Math.max((mindex - 1) / scans, 0);
	const t1 = Math.min((mindex + 1) / scans, 1);
	const d2ForT = (t: number) => getDistance(vec, bezierPoint(out, bezier, t));
	return { out, localMinimum: localMinimum(t0, t1, d2ForT, 1e-4) };
}

/** Find a minimum point for a bounded function. May be a local minimum.
 * minX   : the smallest input value
 * maxX   : the largest input value
 * ƒ      : a function that returns a value `y` given an `x`
 * ε      : how close in `x` the bounds must be before returning
 * returns: the `x` value that produces the smallest `y`
 */
function localMinimum(minX: number, maxX: number, f: (n: number) => number, lim: number) {
	if (lim === undefined) lim = 1e-10;
	let m = minX,
		n = maxX,
		k;
	while (n - m > lim) {
		k = (n + m) / 2;
		if (f(k - lim) < f(k + lim)) n = k;
		else m = k;
	}
	return k;
}

/** Calculate a point along a Bézier segment for a given parameter.
 * out    : A vector to modify to be the point on the curve
 * curve  : Array of vectors representing control points for a Bézier curve
 * t      : Parameter [0,1] for how far along the curve the point should be
 * tmps   : Array of temporary vectors (reduces memory allocations)
 * returns: out (the vector that was modified)
 */
function bezierPoint(out: Vec2, curve: CubicBezier, t: number, tmps?: Vec2[]) {
	if (curve.length < 2) console.error("At least 2 control points are required");
	if (!tmps) {
		tmps = curve.map((pt) => pt.copy());
	} else {
		tmps.forEach((pt, i) => {
			pt.x = curve[i].x;
			pt.y = curve[i].y;
		});
	}

	for (var degree = curve.length - 1; degree--; ) {
		for (var i = 0; i <= degree; ++i) lerp(tmps[i], tmps[i], tmps[i + 1], t);
	}

	out.x = tmps[0].x;
	out.y = tmps[0].y;

	return out;
}

function lerp(out: Vec2, a: Vec2, b: Vec2, t: number) {
	let ax = a.x,
		ay = a.y;
	out.x = ax + t * (b.x - ax);
	out.y = ay + t * (b.y - ay);
	return out;
}
