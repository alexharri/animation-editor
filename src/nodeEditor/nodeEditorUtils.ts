export const transformGlobalToNodeEditorPosition = (
	globalPos: Vec2,
	viewport: Rect,
	scale: number,
	pan: Vec2,
) => {
	let { x, y } = globalPos;
	x -= viewport.left;
	y -= viewport.top;
	x /= scale;
	y /= scale;
	x -= pan.x / scale;
	y -= pan.y / scale;
	x -= viewport.width / 2 / scale;
	y -= viewport.height / 2 / scale;
	return Vec2.new(x, y);
};
