export const useLayerTransform = () => {
	let i = Vec2.new(1, 0);
	let j = Vec2.new(0, 1);

	const rRad = Rotation * DEG_TO_RAD_FAC;

	// Apply rotation
	i = i.apply((vec) => rotateVec2CCW(vec, rRad));
	j = j.apply((vec) => rotateVec2CCW(vec, rRad));

	// Apply scale
	i = i.scale(Scale);
	j = j.scale(Scale);
};
