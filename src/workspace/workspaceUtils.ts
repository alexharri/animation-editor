import { CompositionState } from "~/composition/compositionReducer";
import { getLayerDimensions, getLayerNameToProperty } from "~/composition/layer/layerUtils";
import { transformMat2 } from "~/composition/transformUtils";
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
	compositionState: CompositionState,
	pan: Vec2,
	scale: number,
) => {
	const nameToProperty = getLayerNameToProperty(map, compositionState, layerId);
	const type = compositionState.layers[layerId].type;
	const transform = map.transforms[layerId].transform[0];
	const mat2 = transformMat2(transform);
	const [width, height] = getLayerDimensions(type, nameToProperty);

	const corners = [
		[1, 0],
		[1, 1],
		[0, 1],
		[0, 0],
	].map(([tx, ty]) => {
		let x = tx * width - transform.anchor.x;
		let y = ty * height - transform.anchor.y;

		if (type === LayerType.Ellipse) {
			const r = nameToProperty.OuterRadius;
			x -= r;
			y -= r;
		}

		return mat2.multiply(Vec2.new(x, y)).add(transform.translate).scale(scale).add(pan);
	});

	return corners;
};
