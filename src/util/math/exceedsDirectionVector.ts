type DirectionVector = { x: number; y: number };

const isNegative = (n: number) => n < 0;

/**
 * The `vec` exceeds the `DirectionVector` if it travels at least `distance`
 * in the direction of the `DirectionVector`.
 *
 * Exceeding meaning greater than or equal.
 */
export const exceedsDirectionVector = (
	directionVec: DirectionVector,
	distance: number,
	vec: Vec2,
): "x" | "y" | "" => {
	const axis: "x" | "y" = directionVec.x ? "x" : "y";

	if (isNegative(directionVec[axis]) !== isNegative(vec[axis])) {
		return "";
	}

	return Math.abs(vec[axis]) >= distance ? axis : "";
};
