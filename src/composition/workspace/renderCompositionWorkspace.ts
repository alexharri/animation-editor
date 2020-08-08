import { CompositionLayer } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import {
	applyParentTransform,
	transformMat2,
	_applyIndexTransform,
} from "~/composition/transformUtils";
import {
	getLayerArrayModifierCountPropertyId,
	getLayerCompositionProperties,
} from "~/composition/util/compositionPropertyUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { AffineTransform, CompositionRenderValues, LayerType, PropertyName } from "~/types";
import { isVecInPoly } from "~/util/math";
import { Mat2 } from "~/util/math/mat";

const getNameToProperty = (
	map: CompositionRenderValues,
	compositionState: CompositionState,
	layerId: string,
	index: number,
) => {
	const properties = getLayerCompositionProperties(layerId, compositionState);

	const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
		(obj, p) => {
			const value = map.properties[p.id];
			(obj as any)[PropertyName[p.name]] =
				value.computedValue[index] ?? value.computedValue[0];
			return obj;
		},
		{} as any,
	);

	return nameToProperty;
};

const W = 8;
const R = 5;
const A = 4;
const LW = 1.5;
const SLW = 3;
const SOFF = 1;

interface Options {
	ctx: Ctx;
	viewport: Rect;
	compositionId: string;
	compositionState: CompositionState;
	compositionSelectionState: CompositionSelectionState;
	map: CompositionRenderValues;
	pan: Vec2;
	scale: number;
	mousePosition?: Vec2;
}

export const renderCompWorkspace = (options: Omit<Options, "mousePosition">) => {
	const { ctx, compositionId, compositionState, viewport, pan: _pan, scale } = options;

	const composition = compositionState.compositions[compositionId];

	ctx.clearRect(0, 0, viewport.width, viewport.height);

	const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

	ctx.beginPath();
	ctx.fillStyle = cssVariables.gray700;
	ctx.rect(pan.x, pan.y, composition.width * scale, composition.height * scale);
	ctx.fill();

	function renderRectLayer(
		map: CompositionRenderValues,
		layer: CompositionLayer,
		index: number,
		parentIndexTransforms: AffineTransform[] = [],
	) {
		const nameToProperty = getNameToProperty(map, compositionState, layer.id, index);

		const {
			Width,
			Height,
			// Opacity,
			Fill,
			StrokeWidth,
			StrokeColor,
			// BorderRadius,
		} = nameToProperty;

		const fillColor = `rgba(${Fill.join(",")})`;
		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		let transform = map.transforms[layer.id].transform[index];

		for (let i = 0; i < parentIndexTransforms.length; i += 1) {
			transform = applyParentTransform(parentIndexTransforms[i], transform, true);
		}

		let { indexTransforms } = map.transforms[layer.id];
		if (indexTransforms[index]) {
			transform = _applyIndexTransform(indexTransforms[index], transform);
		}

		const mat2 = transformMat2(transform);

		const corners = [
			[1, 0],
			[1, 1],
			[0, 1],
			[0, 0],
		].map(([tx, ty]) => {
			const x = tx * Width - transform.anchor.x;
			const y = ty * Height - transform.anchor.y;
			return mat2.multiply(Vec2.new(x, y)).add(transform.translate).scale(scale).add(pan);
		});

		ctx.beginPath();
		ctx.moveTo(corners[corners.length - 1].x, corners[corners.length - 1].y);
		for (const p of corners) {
			ctx.lineTo(p.x, p.y);
		}
		ctx.fillStyle = fillColor;
		ctx.fill();

		if (StrokeWidth) {
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = StrokeWidth;
			ctx.stroke();
		}
	}

	function renderEllipse(
		map: CompositionRenderValues,
		layer: CompositionLayer,
		index: number,
		parentIndexTransforms: AffineTransform[] = [],
	) {
		const nameToProperty = getNameToProperty(map, compositionState, layer.id, index);

		const { OuterRadius, InnerRadius, Fill, StrokeWidth, StrokeColor } = nameToProperty;

		const fillColor = `rgba(${Fill.join(",")})`;
		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		let transform = map.transforms[layer.id].transform[index];

		for (let i = 0; i < parentIndexTransforms.length; i += 1) {
			transform = applyParentTransform(parentIndexTransforms[i], transform, true);
		}

		const { indexTransforms } = map.transforms[layer.id];
		if (indexTransforms[index]) {
			transform = _applyIndexTransform(indexTransforms[index], transform);
		}

		const [[ix, iy], [jx, jy]] = transformMat2(transform).matrix;

		const toPos = (_x: number, _y: number) => {
			const p = Vec2.new(_x, _y);

			const x = ix * p.x + jx * p.y + transform.translate.x;
			const y = iy * p.x + jy * p.y + transform.translate.y;

			return Vec2.new(x, y).scale(scale).add(pan);
		};

		const or = Math.abs(OuterRadius * transform.scale * scale);
		const ir = Math.abs(InnerRadius * transform.scale * scale);

		const c = toPos(-transform.anchor.x, -transform.anchor.y);

		ctx.beginPath();
		ctx.arc(c.x, c.y, or, 0, 2 * Math.PI, false);

		if (ir) {
			ctx.arc(c.x, c.y, ir, 0, 2 * Math.PI, false);
		}

		ctx.fillStyle = fillColor;
		ctx.fill("evenodd");

		if (StrokeWidth) {
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth = StrokeWidth * scale;

			ctx.beginPath();
			ctx.arc(c.x, c.y, or, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(c.x, c.y, ir, 0, 2 * Math.PI, false);
			ctx.stroke();
			ctx.closePath();
		}
	}

	function renderCompositionChildren(
		map: CompositionRenderValues,
		compositionId: string,
		parentIndexTransforms: AffineTransform[] = [],
	) {
		const composition = compositionState.compositions[compositionId];
		const layers = composition.layers.map((layerId) => compositionState.layers[layerId]);

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			let count = 1;

			const countPropertyId = getLayerArrayModifierCountPropertyId(
				layer.id,
				compositionState,
			);
			if (countPropertyId) {
				count = map.properties[countPropertyId].computedValue[0];
			}

			if (count < 1) {
				continue;
			}

			for (let i = 0; i < count; i += 1) {
				switch (layer.type) {
					case LayerType.Composition: {
						const indexTransform: AffineTransform =
							count > 1
								? map.transforms[layer.id].indexTransforms[i]
								: {
										anchor: Vec2.new(0, 0),
										rotation: 0,
										scale: 0,
										translate: Vec2.new(0, 0),
								  };
						const indexTransforms = [...parentIndexTransforms, indexTransform];
						renderCompositionChildren(
							map.compositionLayers[layer.id][i],
							compositionState.compositionLayerIdToComposition[layer.id],
							indexTransforms,
						);
						break;
					}

					case LayerType.Rect: {
						renderRectLayer(map, layer, i, parentIndexTransforms);
						break;
					}

					case LayerType.Ellipse: {
						renderEllipse(map, layer, i, parentIndexTransforms);
						break;
					}
				}
			}
		}
	}

	renderCompositionChildren(options.map, compositionId);
};

export function renderCompositionWorkspaceGuides(options: Options) {
	const { ctx, compositionId, compositionState, viewport, pan: _pan, scale } = options;

	const composition = compositionState.compositions[compositionId];

	ctx.clearRect(0, 0, viewport.width, viewport.height);

	const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

	const selection = getCompSelectionFromState(composition.id, options.compositionSelectionState);
	let hasHoveredLayer = false;

	function renderGuides(map: CompositionRenderValues, layer: CompositionLayer, index: number) {
		const selected = selection.layers[layer.id];

		if (hasHoveredLayer && !selected) {
			return;
		}

		const nameToProperty = getNameToProperty(map, compositionState, layer.id, index);

		let width: number;
		let height: number;

		switch (layer.type) {
			case LayerType.Composition: {
				width = nameToProperty.Width;
				height = nameToProperty.Height;
				break;
			}

			case LayerType.Rect: {
				width = nameToProperty.Width;
				height = nameToProperty.Height;
				break;
			}

			case LayerType.Ellipse: {
				width = nameToProperty.OuterRadius * 2;
				height = nameToProperty.OuterRadius * 2;
				break;
			}
		}

		let transform = map.transforms[layer.id].transform[index];

		let { indexTransforms } = map.transforms[layer.id];
		if (indexTransforms[index]) {
			transform = _applyIndexTransform(indexTransforms[index], transform);
		}

		const mat2 = transformMat2(transform);
		const corners = [
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

		if (options.mousePosition && !hasHoveredLayer) {
			const mousePosition = options.mousePosition.sub(Vec2.new(viewport.left, viewport.top));

			if (isVecInPoly(mousePosition, corners)) {
				ctx.beginPath();
				ctx.moveTo(corners[corners.length - 1].x, corners[corners.length - 1].y);
				for (const p of corners) {
					ctx.lineTo(p.x, p.y);
				}
				ctx.strokeStyle = "cyan";
				ctx.lineWidth = LW;
				ctx.stroke();

				hasHoveredLayer = true;
			}
		}

		if (!selected) {
			return;
		}

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

		const c = transform.translate.scale(scale).add(pan);

		ctx.strokeStyle = "black";
		ctx.lineWidth = SLW;

		// Circle shadow
		ctx.beginPath();
		ctx.arc(c.x, c.y, R, 0, 2 * Math.PI, false);
		ctx.stroke();

		const rmat = Mat2.rotation(nameToProperty.Rotation * DEG_TO_RAD_FAC);
		const ri = rmat.i();
		const rj = rmat.j();

		for (const fac of [1, -1]) {
			// Line shadows
			const l0 = c.sub(ri.scale(fac * (R + A + 1)));
			const l1 = c.sub(ri.scale(fac * R));

			const l2 = c.add(rj.scale(fac * (R + A + 1)));
			const l3 = c.add(rj.scale(fac * R));

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
		ctx.arc(c.x, c.y, R, 0, 2 * Math.PI, false);
		ctx.stroke();

		for (const fac of [1, -1]) {
			const l0 = c.sub(ri.scale(fac * (R + A)));
			const l1 = c.sub(ri.scale(fac * R));

			const l2 = c.add(rj.scale(fac * (R + A)));
			const l3 = c.add(rj.scale(fac * R));

			ctx.beginPath();
			ctx.moveTo(l0.x, l0.y);
			ctx.lineTo(l1.x, l1.y);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(l2.x, l2.y);
			ctx.lineTo(l3.x, l3.y);
			ctx.stroke();
		}
	}

	const layers = composition.layers.map((layerId) => compositionState.layers[layerId]);

	for (const layer of layers) {
		renderGuides(options.map, layer, 0);
	}
}
