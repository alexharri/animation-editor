interface LineLineIntersection {
	intersects: boolean;
	x: number;
	y: number;
}

/**
 * The `a` and `b` lines are just for the purposes of an angle, rather than
 * the distance of the line.
 *
 * If the lines are not parallel, an intersection will always be returned.
 */
export function intersectInfiniteLines(a: Line, b: Line): LineLineIntersection {
	const [a1, a2] = a;
	const [b1, b2] = b;

	const ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
	const u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

	if (u_b !== 0) {
		const ua = ua_t / u_b;

		return {
			intersects: true,
			x: a1.x + ua * (a2.x - a1.x),
			y: a1.y + ua * (a2.y - a1.y),
		};
	}

	return {
		intersects: false,
		x: 0,
		y: 0,
	};
}
