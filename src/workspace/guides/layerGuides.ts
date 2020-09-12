import { CompositionLayer } from "~/composition/compositionTypes";
import { getLayerDimensions, getLayerNameToProperty } from "~/composition/layer/layerUtils";
import { transformMat2 } from "~/composition/transformUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import {
	getPathIdToShapeGroupId,
	getShapeLayerPathIds,
	getShapeLayerSelectedPathIds,
	pathIdToCurves,
} from "~/shape/shapeUtils";
import { AffineTransform, CompositionRenderValues, LayerType, NameToProperty } from "~/types";
import { boundingRectOfRects, isVecInPoly, rectCorners } from "~/util/math";
import { pathBoundingRect } from "~/util/math/boundingRect";
import { Mat2 } from "~/util/math/mat";
import { RenderGuidesContext } from "~/workspace/renderTypes";

const W = 8;
const R = 5;
const A = 4;
const LW = 1.5;
const SLW = 3;
const SOFF = 1;

const getShapeLayerRect = (opts: RenderGuidesContext, layer: CompositionLayer) => {
	const {
		composition,
		compositionState,
		compositionSelection,
		shapeState,
		shapeSelectionState,
	} = opts;
	const pathIds = getShapeLayerPathIds(layer.id, compositionState);
	const pathIdToShapeGroupId = getPathIdToShapeGroupId(layer.id, compositionState);
	const rects = pathIds
		.map((pathId) => {
			const shapeGroupId = pathIdToShapeGroupId[pathId];
			const shapeSelected = compositionSelection.properties[shapeGroupId];
			const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
			return pathIdToCurves(pathId, shapeState, shapeSelectionState, shapeMoveVector);
		})
		.filter(Boolean)
		.map((curves) => pathBoundingRect(curves!));
	return boundingRectOfRects(rects);
};

const getCorners = (
	opts: RenderGuidesContext,
	layer: CompositionLayer,
	nameToProperty: NameToProperty,
	scale: number,
	pan: Vec2,
	transform: AffineTransform,
) => {
	if (layer.type === LayerType.Shape) {
		const rect = getShapeLayerRect(opts, layer);
		const mat2 = transformMat2(transform);
		return rectCorners(rect).map((p) =>
			mat2.multiply(p).add(transform.translate).scale(scale).add(pan),
		);
	}

	const [width, height] = getLayerDimensions(layer.type, nameToProperty);
	const mat2 = transformMat2(transform);
	return [
		[1, 0],
		[1, 1],
		[0, 1],
		[0, 0],
	].map(([tx, ty]) => {
		let x = tx * width - transform.anchor.x;
		let y = ty * height - transform.anchor.y;

		if (layer.type === LayerType.Ellipse) {
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

const renderRectsAtCorners = (ctx: Ctx, corners: Vec2[]) => {
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

const renderAnchorGuide = (ctx: Ctx, position: Vec2, rotation: number) => {
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
		compositionSelectionState,
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

	const shouldRenderRectOutline = () => {
		if (layer.type === LayerType.Shape) {
			if (opts.nSelectedShapeLayers === 1 && opts.keyDown.Command) {
				// If there is only a single selected shape layer and Command
				// is selected, then we are attempting to select a shape within
				// the selected shape layer.
				//
				// Do not render layer outline. Instead we render the outline
				// of the individual shape being hovered whilst Command is down.
				return false;
			}

			const selectedPathIds = getShapeLayerSelectedPathIds(
				layer.id,
				compositionState,
				compositionSelectionState,
			);
			return selectedPathIds.length === 0;
		}

		return true;
	};

	const nameToProperty = getLayerNameToProperty(map, compositionState, layer.id);
	const transform = map.transforms[layer.id].transform[index];
	const corners = getCorners(opts, layer, nameToProperty, scale, pan, transform);

	if (mousePosition && !opts.hasHoveredLayer) {
		const viewportMousePosition = mousePosition.sub(Vec2.new(viewport.left, viewport.top));

		const isMouseOverLayer = isVecInPoly(viewportMousePosition, corners);
		if (isMouseOverLayer) {
			opts.hasHoveredLayer = true;

			if (shouldRenderRectOutline()) {
				drawRectOutline(ctx, corners);
			}
		}
	}

	if (!isSelected) {
		return;
	}

	renderRectsAtCorners(ctx, corners);

	const anchorPosition = transform.translate.scale(scale).add(pan);
	const rotation = nameToProperty.Rotation * DEG_TO_RAD_FAC;
	renderAnchorGuide(ctx, anchorPosition, rotation);
}
