import {
	getLayerNameToProperty,
	getLayerRectDimensionsAndOffset,
} from "~/composition/layer/layerUtils";
import { CompositionRenderValues, LayerType } from "~/types";

export const globalToWorkspacePosition = (
	globalPosition: Vec2,
	viewport: Rect,
	scale: number,
	pan: Vec2,
): Vec2 => {
	let { x, y } = globalPosition;
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

export const workspaceLayerBoundingBoxCorners = (
	layerId: string,
	map: CompositionRenderValues,
	actionState: ActionState,
	pan: Vec2,
	scale: number,
) => {
	const { compositionState } = actionState;

	const transform = map.transforms[layerId].transform;

	const layer = compositionState.layers[layerId];

	const nameToProperty = getLayerNameToProperty(map.properties, compositionState, layerId);
	const [width, height, offX, offY] = getLayerRectDimensionsAndOffset(
		layer,
		nameToProperty,
		actionState,
	);

	const corners = [
		[1, 0],
		[1, 1],
		[0, 1],
		[0, 0],
	].map(([tx, ty]) => {
		let x = offX + tx * width - transform.anchor.x;
		let y = offY + ty * height - transform.anchor.y;

		if (layer.type === LayerType.Ellipse) {
			const r = nameToProperty.OuterRadius;
			x -= r;
			y -= r;
		}

		return transform.matrix
			.multiply(Vec2.new(x, y))
			.add(transform.translate)
			.scale(scale)
			.add(pan);
	});

	return corners;
};
