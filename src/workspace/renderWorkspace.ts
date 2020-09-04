import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { CompositionLayer } from "~/composition/compositionTypes";
import { reduceLayerProperties } from "~/composition/compositionUtils";
import { getLayerDimensions } from "~/composition/layer/layerUtils";
import { applyParentTransform, transformMat2 } from "~/composition/transformUtils";
import {
	getLayerArrayModifiers,
	getLayerCompositionProperties,
} from "~/composition/util/compositionPropertyUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { DEG_TO_RAD_FAC, Tool } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import {
	getPathTargetObject,
	getShapeContinuePathFrom,
	getShapeLayerDirectlySelectedPaths,
	getShapeLayerPathIds,
	getShapeLayerSelectedPathIds,
	getShapePathClosePathNodeId,
	getShapeSelectionFromState,
	pathIdToPathList,
} from "~/shape/shapeUtils";
import { AffineTransform, CompositionRenderValues, LayerType, PropertyName } from "~/types";
import {
	renderDiamond,
	traceCircle,
	traceCubicBezier,
	traceLine,
	tracePath,
} from "~/util/canvas/renderPrimitives";
import { getAngleRadians, getDistance, isVecInPoly, quadraticToCubicBezier } from "~/util/math";
import { Mat2 } from "~/util/math/mat";

const getNameToProperty = (
	map: CompositionRenderValues,
	compositionState: CompositionState,
	layerId: string,
) => {
	const properties = getLayerCompositionProperties(layerId, compositionState);

	const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
		(obj, p) => {
			const value = map.properties[p.id];
			(obj as any)[PropertyName[p.name]] = value.computedValue;
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
	shapeState: ShapeState;
	shapeSelectionState: ShapeSelectionState;
	map: CompositionRenderValues;
	pan: Vec2;
	scale: number;
	mousePosition?: Vec2;
	selectionRect: Rect | null;
	tool: Tool;
	isPerformingAction: boolean;
}

export const renderWorkspace = (options: Omit<Options, "mousePosition">) => {
	const {
		ctx,
		compositionId,
		compositionState,
		shapeState,
		shapeSelectionState,
		viewport,
		pan: _pan,
		scale,
	} = options;

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
		const nameToProperty = getNameToProperty(map, compositionState, layer.id);

		const { Width, Height, Fill, StrokeWidth, StrokeColor } = nameToProperty;

		const fillColor = `rgba(${Fill.join(",")})`;
		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		let transform = map.transforms[layer.id].transform[index];

		for (let i = 0; i < parentIndexTransforms.length; i += 1) {
			transform = applyParentTransform(parentIndexTransforms[i], transform, true);
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
		ctx.closePath();
	}

	function renderEllipse(
		map: CompositionRenderValues,
		layer: CompositionLayer,
		index: number,
		parentIndexTransforms: AffineTransform[] = [],
	) {
		const nameToProperty = getNameToProperty(map, compositionState, layer.id);

		const { OuterRadius, InnerRadius, Fill, StrokeWidth, StrokeColor } = nameToProperty;

		const fillColor = `rgba(${Fill.join(",")})`;
		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		let transform = map.transforms[layer.id].transform[index];

		for (let i = 0; i < parentIndexTransforms.length; i += 1) {
			transform = applyParentTransform(parentIndexTransforms[i], transform, true);
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
		ctx.closePath();

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

	function renderShapeLayer(
		map: CompositionRenderValues,
		layer: CompositionLayer,
		index: number,
		parentIndexTransforms: AffineTransform[] = [],
	) {
		const pathIds = reduceLayerProperties<string[]>(
			layer.id,
			compositionState,
			(acc, property) => {
				if (property.name === PropertyName.ShapeLayer_Path) {
					acc.push(property.value);
				}
				return acc;
			},
			[],
		);

		let transform = map.transforms[layer.id].transform[index];

		for (let i = 0; i < parentIndexTransforms.length; i += 1) {
			transform = applyParentTransform(parentIndexTransforms[i], transform, true);
		}
		const mat2 = transformMat2(transform);

		const toPos = (vec: Vec2): Vec2 => {
			return mat2
				.multiplyVec2(vec.sub(transform.anchor))
				.add(transform.translate)
				.scale(scale)
				.add(pan);
		};

		for (const pathId of pathIds) {
			const paths = pathIdToPathList(pathId, shapeState, shapeSelectionState, toPos);

			if (!paths) {
				continue;
			}

			ctx.beginPath();
			for (const path of paths) {
				tracePath(ctx, path);
			}
			ctx.strokeStyle = cssVariables.dark300;
			ctx.lineWidth = 2 * scale;
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

		const renderLayer = (layer: CompositionLayer, transformList: AffineTransform[]) => {
			switch (layer.type) {
				case LayerType.Composition: {
					renderCompositionChildren(
						map.compositionLayers[layer.id][0],
						compositionState.compositionLayerIdToComposition[layer.id],
						transformList,
					);
					break;
				}

				case LayerType.Shape: {
					renderShapeLayer(map, layer, 0, transformList);
					break;
				}

				case LayerType.Rect: {
					renderRectLayer(map, layer, 0, transformList);
					break;
				}

				case LayerType.Ellipse: {
					renderEllipse(map, layer, 0, transformList);
					break;
				}
			}
		};

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];

			const arrayModifiers = getLayerArrayModifiers(layer.id, compositionState);

			if (!arrayModifiers.length) {
				renderLayer(layer, []);
				continue;
			}

			function dimension(dimensionIndex: number, transforms: AffineTransform[] = []) {
				const mod = arrayModifiers[dimensionIndex];
				const count = Math.max(1, map.properties[mod.countId].computedValue);

				const hasNext = !!arrayModifiers[dimensionIndex + 1];

				for (let i = 0; i < count; i++) {
					const transform = map.transforms[layer.id].indexTransforms[dimensionIndex][i];

					if (hasNext) {
						dimension(dimensionIndex + 1, [...transforms, transform]);
						continue;
					}

					const transformList = [...parentIndexTransforms, ...transforms, transform];

					renderLayer(layer, transformList);
				}
			}

			dimension(0);
		}
	}

	renderCompositionChildren(options.map, compositionId);
};

export function renderCompositionWorkspaceGuides(options: Options) {
	const {
		ctx,
		compositionId,
		compositionState,
		compositionSelectionState,
		shapeState,
		shapeSelectionState,
		viewport,
		pan: _pan,
		scale,
	} = options;

	const composition = compositionState.compositions[compositionId];

	ctx.clearRect(0, 0, viewport.width, viewport.height);

	const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

	const selection = getCompSelectionFromState(composition.id, compositionSelectionState);
	let hasHoveredLayer = false;

	function renderGuides(map: CompositionRenderValues, layer: CompositionLayer) {
		const index = 0;

		const selected = selection.layers[layer.id];

		if (hasHoveredLayer && !selected) {
			return;
		}

		const nameToProperty = getNameToProperty(map, compositionState, layer.id);
		const [width, height] = getLayerDimensions(layer.type, nameToProperty);

		let transform = map.transforms[layer.id].transform[index];

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

	function renderShapeLayerGuides(map: CompositionRenderValues, layer: CompositionLayer) {
		if (!selection.layers[layer.id]) {
			return;
		}

		const directlySelectedPaths = getShapeLayerDirectlySelectedPaths(
			layer.id,
			compositionState,
			compositionSelectionState,
		);
		const pathIds = getShapeLayerSelectedPathIds(
			layer.id,
			compositionState,
			compositionSelectionState,
		);

		const transform = map.transforms[layer.id].transform[0];
		const mat2 = transformMat2(transform);

		const toPos = (vec: Vec2): Vec2 => {
			return mat2
				.multiplyVec2(vec.sub(transform.anchor))
				.add(transform.translate)
				.scale(scale)
				.add(pan);
		};

		let continueFrom: {
			pathId: string;
			direction: "left" | "right";
		} | null;
		let closePathNodeId: string | null = null;

		continueFrom: {
			const { mousePosition, isPerformingAction } = options;

			if (!mousePosition || isPerformingAction) {
				break continueFrom;
			}

			const selection = getCompSelectionFromState(compositionId, compositionSelectionState);
			const selectedShapeLayers = Object.keys(selection.layers).filter((layerId) => {
				const layer = compositionState.layers[layerId];
				return layer.type === LayerType.Shape;
			});

			if (selectedShapeLayers.length !== 1 || selectedShapeLayers[0] !== layer.id) {
				break continueFrom;
			}

			const pathIds = getShapeLayerPathIds(layer.id, compositionState);
			continueFrom = getShapeContinuePathFrom(pathIds, shapeState, shapeSelectionState);

			if (continueFrom) {
				closePathNodeId = getShapePathClosePathNodeId(continueFrom, shapeState);
			}
		}

		let hasTargetObject = false;

		for (const pathId of pathIds) {
			const path = shapeState.paths[pathId];
			const { shapeId } = path;

			const isPathDirectlySelected = directlySelectedPaths.has(pathId);

			const shape = shapeState.shapes[shapeId];
			const selection = getShapeSelectionFromState(shapeId, shapeSelectionState);

			const paths = pathIdToPathList(pathId, shapeState, shapeSelectionState, toPos);

			if (paths) {
				ctx.beginPath();
				for (const path of paths) {
					tracePath(ctx, path);
				}
				ctx.strokeStyle = cssVariables.light300;
				ctx.lineWidth = 0.75;
				ctx.stroke();
				ctx.closePath();
			}

			if (!hasTargetObject && options.tool === Tool.pen && options.mousePosition) {
				const mousePosition = options.mousePosition.sub(
					Vec2.new(viewport.left, viewport.top),
				);

				const targetObject = getPathTargetObject(
					pathId,
					mousePosition,
					toPos,
					transform,
					shapeState,
					shapeSelectionState,
				);

				if (targetObject.type) {
					hasTargetObject = true;
				}

				switch (targetObject.type) {
					case "node": {
						if (closePathNodeId !== targetObject.id) {
							break;
						}

						const item0 = path.items[0];
						const item1 = path.items[path.items.length - 1];

						const n0Id = item1.nodeId;
						const n1Id = item0.nodeId;
						const cp0Id = item1.right?.controlPointId;
						const cp1Id = item0.left?.controlPointId;

						const p0 = shapeState.nodes[n0Id].position;
						const p3 = shapeState.nodes[n1Id].position;

						const p1 = cp0Id ? p0.add(shapeState.controlPoints[cp0Id]!.position) : null;
						const p2 = cp1Id ? p3.add(shapeState.controlPoints[cp1Id]!.position) : null;

						let p: Line | CubicBezier;

						if (p1 && p2) {
							p = [p0, p1, p2, p3];
						} else if (p1 || p2) {
							p = quadraticToCubicBezier(p0, p1, p2, p3);
						} else {
							p = [p0, p3];
						}

						for (let i = 0; i < p.length; i += 1) {
							p[i] = toPos(p[i]);
						}

						ctx.beginPath();
						tracePath(ctx, p);
						ctx.strokeStyle = cssVariables.primary500;
						ctx.lineWidth = 1;
						ctx.stroke();
						ctx.closePath();
						break;
					}

					case "point_on_edge": {
						const { point } = targetObject;
						ctx.beginPath();
						traceCircle(ctx, point, 3.5);
						ctx.lineWidth = 2.5;
						ctx.fillStyle = "white";
						ctx.strokeStyle = cssVariables.primary600;
						ctx.stroke();
						ctx.fill();
						break;
					}
				}
			}

			// Render edges
			if (isPathDirectlySelected) {
				for (let i = 0; i < path.items.length; i += 1) {
					const { nodeId, left, right, reflectControlPoints } = path.items[i];

					const parts = [left, right];

					for (let i = 0; i < 2; i += 1) {
						const part0 = parts[i];

						if (!part0) {
							continue;
						}

						const cp = shapeState.controlPoints[part0.controlPointId];

						if (!cp) {
							continue;
						}

						const part1 = parts[(i + 1) % 2];
						const otherCpId = part1?.controlPointId;

						const node = shapeState.nodes[nodeId];
						const nodeSelected = selection.nodes[nodeId];
						const cpSelected = selection.controlPoints[part0.controlPointId];
						const otherCpSelected = !!(otherCpId && selection.controlPoints[otherCpId]);
						const reflect = reflectControlPoints;

						let p0: Vec2;
						let p1: Vec2;

						if (
							reflect &&
							!nodeSelected &&
							!cpSelected &&
							otherCpSelected &&
							(shape.moveVector.x !== 0 || shape.moveVector.y !== 0)
						) {
							const otherCp = shapeState.controlPoints[otherCpId!]!;

							p0 = node.position;
							p1 = otherCp!.position.add(shape.moveVector);

							const dist = getDistance(Vec2.new(0, 0), cp.position);
							const angle = getAngleRadians(Vec2.new(0, 0), p1);
							const rmat = Mat2.rotation(angle + Math.PI);
							const cppos = rmat.multiplyVec2(Vec2.new(dist, 0));

							p1 = p0.add(cppos);
						} else {
							p0 = node.position;
							if (selection.nodes[node.id]) {
								p0 = p0.add(shape.moveVector);
							}

							p1 = p0.add(cp.position);
							if (selection.controlPoints[cp.id] && !selection.nodes[node.id]) {
								p1 = p1.add(shape.moveVector);
							}
						}

						// Render handle line
						ctx.beginPath();
						traceLine(ctx, [toPos(p0), toPos(p1)]);
						ctx.lineWidth = 1;
						ctx.strokeStyle = cssVariables.light300;
						ctx.stroke();
						ctx.closePath();

						// Render handle diamond
						renderDiamond(
							ctx,
							toPos(p1),
							selection.controlPoints[cp.id]
								? {
										fillColor: cssVariables.primary600,
										strokeColor: "white",
										strokeWidth: 1,
										width: 7,
										height: 7,
								  }
								: {
										fillColor: "white",
										strokeColor: cssVariables.primary600,
										strokeWidth: 1,
										width: 7,
										height: 7,
								  },
						);
					}
				}
			}

			// Render nodes
			for (const nodeId of shape.nodes) {
				if (!nodeId) {
					continue;
				}

				const node = shapeState.nodes[nodeId];
				let position = node.position;

				if (selection.nodes[node.id]) {
					position = position.add(shape.moveVector);
				}

				const selected = selection.nodes[nodeId];

				ctx.beginPath();
				if (selected) {
					if (isPathDirectlySelected) {
						traceCircle(ctx, toPos(position), 4.5);
						ctx.lineWidth = 2.5;
						ctx.fillStyle = cssVariables.primary600;
						ctx.strokeStyle = "white";
						ctx.stroke();
						ctx.fill();
					} else {
						traceCircle(ctx, toPos(position), 5);
						ctx.lineWidth = 1.5;
						ctx.strokeStyle = "white";
						ctx.stroke();

						traceCircle(ctx, toPos(position), 3);
						ctx.fillStyle = cssVariables.primary600;
						ctx.fill("evenodd");
					}
				} else {
					if (isPathDirectlySelected) {
						traceCircle(ctx, toPos(position), 3.5);
						ctx.lineWidth = 2.5;
						ctx.fillStyle = "white";
						ctx.strokeStyle = cssVariables.primary600;
						ctx.stroke();
						ctx.fill();
					} else {
						traceCircle(ctx, toPos(position), 4.5);
						traceCircle(ctx, toPos(position), 2.5);
						ctx.fillStyle = cssVariables.primary600;
						ctx.fill("evenodd");
					}
				}
				ctx.closePath();
			}
		}

		const renderContinue = () => {
			if (!continueFrom) {
				return;
			}

			const { direction, pathId } = continueFrom;

			const path = shapeState.paths[pathId];
			const item = path.items[direction === "left" ? 0 : path.items.length - 1];
			const nodeId = item.nodeId;
			const part = direction === "left" ? item.left : item.right;

			const node = shapeState.nodes[nodeId];
			const p0 = toPos(node.position);
			const p3 = options.mousePosition!.sub(Vec2.new(viewport.left, viewport.top));

			ctx.beginPath();

			if (!part || !part.controlPointId) {
				traceLine(ctx, [p0, p3]);
			} else {
				const cp = shapeState.controlPoints[part.controlPointId]!;
				const p1 = toPos(node.position.add(cp.position));
				const bezier = quadraticToCubicBezier(p0, p1, null, p3);
				traceCubicBezier(ctx, bezier);
			}

			ctx.strokeStyle = cssVariables.primary500;
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			traceCircle(ctx, p3, 3.5);
			ctx.lineWidth = 2.5;
			ctx.fillStyle = "white";
			ctx.strokeStyle = cssVariables.primary600;
			ctx.stroke();
			ctx.fill();
			ctx.closePath();
		};

		if (!hasTargetObject && options.tool === Tool.pen) {
			renderContinue();
		}
	}

	const layers = composition.layers.map((layerId) => compositionState.layers[layerId]);

	for (const layer of layers) {
		renderGuides(options.map, layer);

		if (layer.type === LayerType.Shape) {
			renderShapeLayerGuides(options.map, layer);
		}
	}

	if (options.selectionRect) {
		const rect = options.selectionRect!;

		const p0 = Vec2.new(rect.left, rect.top).scale(scale).add(pan);
		const p1 = Vec2.new(rect.left + rect.width, rect.top + rect.height)
			.scale(scale)
			.add(pan);

		ctx.beginPath();
		ctx.moveTo(p0.x, p0.y);
		ctx.lineTo(p1.x, p0.y);
		ctx.lineTo(p1.x, p1.y);
		ctx.lineTo(p0.x, p1.y);
		ctx.lineTo(p0.x, p0.y);
		ctx.fillStyle = "rgba(255, 255, 255, .2)";
		ctx.strokeStyle = "rgba(255, 255, 255, .8)";
		ctx.lineWidth = 1;
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	}
}
