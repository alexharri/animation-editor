import { CompositionLayer } from "~/composition/compositionTypes";
import { getLayerDimensions, getLayerNameToProperty } from "~/composition/layer/layerUtils";
import { transformMat2 } from "~/composition/transformUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { AffineTransform, CompositionRenderValues, LayerType, NameToProperty } from "~/types";
import { isVecInPoly } from "~/util/math";
import { Mat2 } from "~/util/math/mat";
import { RenderGuidesContext } from "~/workspace/renderTypes";

const W = 8;
const R = 5;
const A = 4;
const LW = 1.5;
const SLW = 3;
const SOFF = 1;

const getCorners = (
	layerType: LayerType,
	nameToProperty: NameToProperty,
	scale: number,
	pan: Vec2,
	transform: AffineTransform,
) => {
	const [width, height] = getLayerDimensions(layerType, nameToProperty);
	const mat2 = transformMat2(transform);
	return [
		[1, 0],
		[1, 1],
		[0, 1],
		[0, 0],
	].map(([tx, ty]) => {
		let x = tx * width - transform.anchor.x;
		let y = ty * height - transform.anchor.y;

		if (layerType === LayerType.Ellipse) {
			const r = nameToProperty.OuterRadius;
			x -= r;
			y -= r;
		}

		return mat2.multiply(Vec2.new(x, y)).add(transform.translate).scale(scale).add(pan);
	});
};

const drawRectOutline = (ctx: Ctx, corners: Vec2[]) => {
	ctx.beginPath();
	const lastCorner = corners[corners.length - 1];
	ctx.moveTo(lastCorner.x, lastCorner.y);
	for (const p of corners) {
		ctx.lineTo(p.x, p.y);
	}
	ctx.strokeStyle = "cyan";
	ctx.lineWidth = LW;
	ctx.stroke();
	ctx.closePath();
};

const drawRectsAtCorners = (ctx: Ctx, corners: Vec2[]) => {
	for (const c of corners) {
		const x = c.x - W / 2;
		const y = c.y - W / 2;

		// Render shadow
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.rect(x + SOFF, y + SOFF, W, W);
		ctx.fill();

		// Render square
		ctx.beginPath();
		ctx.fillStyle = "cyan";
		ctx.rect(x, y, W, W);
		ctx.fill();
	}
};

const drawAnchorGuide = (ctx: Ctx, position: Vec2, rotation: number) => {
	ctx.strokeStyle = "black";
	ctx.lineWidth = SLW;

	// Circle shadow
	ctx.beginPath();
	ctx.arc(position.x, position.y, R, 0, 2 * Math.PI, false);
	ctx.stroke();

	const rmat = Mat2.rotation(rotation);
	const ri = rmat.i();
	const rj = rmat.j();

	for (const fac of [1, -1]) {
		// Line shadows
		const l0 = position.sub(ri.scale(fac * (R + A + 1)));
		const l1 = position.sub(ri.scale(fac * R));

		const l2 = position.add(rj.scale(fac * (R + A + 1)));
		const l3 = position.add(rj.scale(fac * R));

		ctx.beginPath();
		ctx.moveTo(l0.x, l0.y);
		ctx.lineTo(l1.x, l1.y);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(l2.x, l2.y);
		ctx.lineTo(l3.x, l3.y);
		ctx.stroke();
	}

	ctx.strokeStyle = "cyan";
	ctx.lineWidth = LW;

	// Circle
	ctx.beginPath();
	ctx.arc(position.x, position.y, R, 0, 2 * Math.PI, false);
	ctx.stroke();

	for (const fac of [1, -1]) {
		const l0 = position.sub(ri.scale(fac * (R + A)));
		const l1 = position.sub(ri.scale(fac * R));

		const l2 = position.add(rj.scale(fac * (R + A)));
		const l3 = position.add(rj.scale(fac * R));

		ctx.beginPath();
		ctx.moveTo(l0.x, l0.y);
		ctx.lineTo(l1.x, l1.y);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(l2.x, l2.y);
		ctx.lineTo(l3.x, l3.y);
		ctx.stroke();
	}
};

export function renderLayerGuides(
	opts: RenderGuidesContext,
	ctx: Ctx,
	map: CompositionRenderValues,
	layer: CompositionLayer,
) {
	const {
		compositionSelection: selection,
		compositionState,
		scale,
		pan,
		viewport,
		mousePosition,
	} = opts;

	const index = 0; // Guides are always based on the layer at i=0
	const isSelected = selection.layers[layer.id];

	if (opts.hasHoveredLayer && !isSelected) {
		return;
	}

	const nameToProperty = getLayerNameToProperty(map, compositionState, layer.id);
	const transform = map.transforms[layer.id].transform[index];
	const corners = getCorners(layer.type, nameToProperty, scale, pan, transform);

	if (mousePosition && !opts.hasHoveredLayer) {
		const viewportMousePosition = mousePosition.sub(Vec2.new(viewport.left, viewport.top));

		const isMouseOverLayer = isVecInPoly(viewportMousePosition, corners);
		if (isMouseOverLayer) {
			opts.hasHoveredLayer = true;
			drawRectOutline(ctx, corners);
		}
	}

	if (!isSelected) {
		return;
	}

	drawRectsAtCorners(ctx, corners);

	const anchorPosition = transform.translate.scale(scale).add(pan);
	const rotation = nameToProperty.Rotation * DEG_TO_RAD_FAC;
	drawAnchorGuide(ctx, anchorPosition, rotation);
}
