import { CompositionLayer } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { applyIndexTransform } from "~/composition/transformUtils";
import {
	getLayerArrayModifierCountPropertyId,
	getLayerCompositionProperties,
} from "~/composition/util/compositionPropertyUtils";
import { cssVariables } from "~/cssVariables";
import { AffineTransform, CompositionRenderValues, LayerType, PropertyName } from "~/types";
import { rotateVec2CCW } from "~/util/math";

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

interface Options {
	ctx: Ctx;
	viewport: Rect;
	compositionId: string;
	compositionState: CompositionState;
	map: CompositionRenderValues;
	pan: Vec2;
	scale: number;
}

export const renderCompWorkspace = (options: Options) => {
	const { ctx, compositionId, compositionState, viewport, pan: _pan, scale } = options;

	const composition = compositionState.compositions[compositionId];

	ctx.clearRect(0, 0, viewport.width, viewport.height);

	const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

	ctx.beginPath();
	ctx.fillStyle = cssVariables.gray700;
	ctx.rect(pan.x, pan.y, composition.width * scale, composition.height * scale);
	ctx.fill();

	const getTransformMatrix = (
		transform: AffineTransform,
	): [[number, number], [number, number]] => {
		// Identity vectors
		let i = Vec2.new(1, 0);
		let j = Vec2.new(0, 1);

		const rRad = transform.rotation;

		// Apply rotation
		i = i.apply((vec) => rotateVec2CCW(vec, rRad));
		j = j.apply((vec) => rotateVec2CCW(vec, rRad));

		// Apply scale
		i = i.scale(transform.scale);
		j = j.scale(transform.scale);

		return [
			[i.x, i.y],
			[j.x, j.y],
		];
	};

	function renderRectLayer(map: CompositionRenderValues, layer: CompositionLayer, index: number) {
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
		let { indexTransform } = map.transforms[layer.id];

		if (indexTransform) {
			transform = applyIndexTransform(transform, indexTransform, index);
		}

		const [[ix, iy], [jx, jy]] = getTransformMatrix(transform);

		const pArr = [
			[1, 0],
			[1, 1],
			[0, 1],
			[0, 0],
		].map(([_0, _1]) => {
			const p = Vec2.new(_0 * Width, _1 * Height).sub(transform.anchor);

			const x = ix * p.x + jx * p.y + transform.translate.x;
			const y = iy * p.x + jy * p.y + transform.translate.y;

			return Vec2.new(x, y).scale(scale).add(pan);
		});

		ctx.beginPath();
		ctx.moveTo(pArr[pArr.length - 1].x, pArr[pArr.length - 1].y);
		for (const p of pArr) {
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

	function renderEllipse(map: CompositionRenderValues, layer: CompositionLayer, index: number) {
		const nameToProperty = getNameToProperty(map, compositionState, layer.id, index);

		const { OuterRadius, InnerRadius, Fill, StrokeWidth, StrokeColor } = nameToProperty;

		const fillColor = `rgba(${Fill.join(",")})`;
		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		let transform = map.transforms[layer.id].transform[index];
		let { indexTransform } = map.transforms[layer.id];

		if (indexTransform) {
			transform = applyIndexTransform(transform, indexTransform, index);
		}

		const [[ix, iy], [jx, jy]] = getTransformMatrix(transform);

		const toPos = (_x: number, _y: number) => {
			const p = Vec2.new(_x, _y);

			const x = ix * p.x + jx * p.y + transform.translate.x;
			const y = iy * p.x + jy * p.y + transform.translate.y;

			return Vec2.new(x, y).scale(scale).add(pan);
		};

		const or = OuterRadius * transform.scale * scale;
		const ir = InnerRadius * transform.scale * scale;

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

	function renderCompositionChildren(map: CompositionRenderValues, compositionId: string) {
		const composition = compositionState.compositions[compositionId];
		const layers = composition.layers.map((layerId) => compositionState.layers[layerId]);
		for (const layer of layers) {
			let count = 1;

			const countPropertyId = getLayerArrayModifierCountPropertyId(
				layer.id,
				compositionState,
			);
			if (countPropertyId) {
				count = map.properties[countPropertyId].computedValue[0];
			}

			for (let i = 0; i < count; i += 1) {
				switch (layer.type) {
					case LayerType.Composition: {
						renderCompositionChildren(
							map.compositionLayers[layer.id][i],
							compositionState.compositionLayerIdToComposition[layer.id],
						);
						break;
					}

					case LayerType.Rect: {
						renderRectLayer(map, layer, i);
						break;
					}

					case LayerType.Ellipse: {
						renderEllipse(map, layer, i);
						break;
					}
				}
			}
		}
	}

	renderCompositionChildren(options.map, compositionId);
};
