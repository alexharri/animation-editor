import { rotateVec2CCW } from "~/util/math";

export const getLayerTransformStyle = (
	positionX: number,
	positionY: number,
	anchorX: number,
	anchorY: number,
	rotation: number,
	scale: number,
) => {
	// Identity matrix
	let i = Vec2.new(1, 0);
	let j = Vec2.new(0, 1);

	const rRad = rotation;

	// Apply rotation
	i = i.apply((vec) => rotateVec2CCW(vec, rRad));
	j = j.apply((vec) => rotateVec2CCW(vec, rRad));

	// Apply scale
	i = i.scale(scale);
	j = j.scale(scale);

	const tx = positionX - anchorX;
	const ty = positionY - anchorY;

	const transformStyle = `matrix(${[i.x, i.y, j.x, j.y, tx, ty].join(",")})`;
	return {
		transform: transformStyle,
		transformOrigin: `${anchorX}px ${anchorY}px`,
	};
};
