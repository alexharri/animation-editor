import { AffineTransform } from "~/types";
import { rotateVec2CCW } from "~/util/math";

export const getLayerTransformStyle = (transform: AffineTransform) => {
	// Identity matrix
	let i = Vec2.new(1, 0);
	let j = Vec2.new(0, 1);

	const rRad = transform.rotation;

	// Apply rotation
	i = i.apply((vec) => rotateVec2CCW(vec, rRad));
	j = j.apply((vec) => rotateVec2CCW(vec, rRad));

	// Apply scale
	i = i.scale(transform.scale);
	j = j.scale(transform.scale);

	const tx = transform.translate.x - transform.anchor.x;
	const ty = transform.translate.y - transform.anchor.y;

	const transformStyle = `matrix(${[i.x, i.y, j.x, j.y, tx, ty].join(",")})`;
	return {
		transform: transformStyle,
		transformOrigin: `${transform.anchor.x}px ${transform.anchor.y}px`,
	};
};
