/* tslint:disable */

const Polynomial = require("kld-polynomial").Polynomial;

const mulvec2 = (vec: Vec2, scalar: number) => Vec2.new(vec.x * scalar, vec.y * scalar);
const minVec2 = (a: Vec2, b: Vec2): Vec2 => Vec2.new(Math.min(a.x, b.x), Math.min(a.y, b.y));
const maxVec2 = (a: Vec2, b: Vec2): Vec2 => Vec2.new(Math.max(a.x, b.x), Math.max(a.y, b.y));
const dotvec2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
const lerp = (a: Vec2, b: Vec2, t: number) =>
	Vec2.new(a.x * (1 - t) + b.x * t, a.y * (1 - t) + b.y * t);

export function intersectCubicBezierLine(bezier: CubicBezier, line: Line) {
	const [p1, p2, p3, p4] = bezier;
	const [a1, a2] = line;

	const results: Array<{ vec: Vec2; t: number }> = [];

	let a: Vec2, b: Vec2, c: Vec2, d: Vec2;
	let c3: Vec2, c2: Vec2, c1: Vec2, c0: Vec2; // coefficients of cubic
	let cl: number; // c coefficient for normal form of line
	let n: Vec2; // normal for normal form of line
	let min = minVec2(a1, a2); // used to determine if point is on line segment
	let max = maxVec2(a1, a2); // used to determine if point is on line segment

	// Start with Bezier using Bernstein polynomials for weighting functions:
	//     (1-t^3)P1 + 3t(1-t)^2P2 + 3t^2(1-t)P3 + t^3P4
	//
	// Expand and collect terms to form linear combinations of original Bezier
	// controls.  This ends up with a vector cubic in t:
	//     (-P1+3P2-3P3+P4)t^3 + (3P1-6P2+3P3)t^2 + (-3P1+3P2)t + P1
	//             /\                  /\                /\       /\
	//             ||                  ||                ||       ||
	//             c3                  c2                c1       c0

	// Calculate the coefficients
	a = mulvec2(p1, -1);
	b = mulvec2(p2, 3);
	c = mulvec2(p3, -3);
	d = a.add(b).add(c).add(p4);
	c3 = d.copy();

	a = mulvec2(p1, 3);
	b = mulvec2(p2, -6);
	c = mulvec2(p3, 3);
	d = a.add(b).add(c);
	c2 = d.copy();

	a = mulvec2(p1, -3);
	b = mulvec2(p2, 3);
	c = a.add(b);
	c1 = c.copy();

	c0 = p1.copy();

	// Convert line to normal form: ax + by + c = 0
	// Find normal to line: negative inverse of original line's slope
	n = Vec2.new(a1.y - a2.y, a2.x - a1.x);

	// Determine new c coefficient
	cl = a1.x * a2.y - a2.x * a1.y;

	// ?Rotate each cubic coefficient using line for new coordinate system?
	// Find roots of rotated cubic
	const roots = new Polynomial(
		dotvec2(n, c3),
		dotvec2(n, c2),
		dotvec2(n, c1),
		dotvec2(n, c0) + cl,
	).getRoots();

	// Any roots in closed interval [0,1] are intersections on Bezier, but
	// might not be on the line segment.
	// Find intersections and calculate point coordinates
	for (let i = 0; i < roots.length; i++) {
		const t = roots[i];

		if (0 <= t && t <= 1) {
			// We're within the Bezier curve
			// Find point on Bezier
			const p5 = lerp(p1, p2, t);
			const p6 = lerp(p2, p3, t);
			const p7 = lerp(p3, p4, t);

			const p8 = lerp(p5, p6, t);
			const p9 = lerp(p6, p7, t);

			const p10 = lerp(p8, p9, t);

			// See if point is on line segment
			// Had to make special cases for vertical and horizontal lines due
			// to slight errors in calculation of p10
			if (a1.x === a2.x) {
				if (min.y <= p10.y && p10.y <= max.y) {
					results.push({ vec: p10, t });
				}
			} else if (a1.y === a2.y) {
				if (min.x <= p10.x && p10.x <= max.x) {
					results.push({ vec: p10, t });
				}
			} else if (min.x <= p10.x && p10.x <= max.x && min.y <= p10.y && p10.y <= max.y) {
				results.push({ vec: p10, t });
			}
		}
	}

	return results;
}
