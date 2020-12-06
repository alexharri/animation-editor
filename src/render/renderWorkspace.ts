import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { Layer, Property, PropertyGroup } from "~/composition/compositionTypes";
import { reduceLayerPropertiesAndGroups } from "~/composition/compositionUtils";
import {
	applyIndexTransformToLayer,
	applyParentIndexTransform,
} from "~/composition/transformUtils";
import {
	getLayerArrayModifiers,
	getLayerCompositionProperties,
} from "~/composition/util/compositionPropertyUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { Tool } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { ShapeState } from "~/shape/shapeReducer";
import { ShapeSelectionState } from "~/shape/shapeSelectionReducer";
import {
	getCompositionSelectedPathsSet,
	getShapeFillGroupValues,
	getShapeLayerDirectlySelectedPaths,
	getShapeStrokeGroupValues,
	pathIdToCurves,
} from "~/shape/shapeUtils";
import {
	CompositionRenderValues,
	LayerTransform,
	LayerType,
	ParentIndexTransform,
	PropertyGroupName,
	PropertyName,
} from "~/types";
import { traceCurve } from "~/util/canvas/renderPrimitives";
import { rgbaToString } from "~/util/color/convertColor";
import { interpolate } from "~/util/math";
import { renderLayerGuides } from "~/workspace/guides/layerGuides";
import { renderShapeLayerGuides } from "~/workspace/guides/shapeLayerGuides";
import { RenderGuidesContext } from "~/workspace/renderTypes";

const computeLayerTransform = (
	transform: LayerTransform,
	indexTransforms: LayerTransform[],
	parentIndexTransforms: ParentIndexTransform[],
) => {
	for (let i = 0; i < indexTransforms.length; i += 1) {
		transform = applyIndexTransformToLayer(transform, indexTransforms[i]);
	}
	for (let i = 0; i < parentIndexTransforms.length; i += 1) {
		transform = applyParentIndexTransform(transform, parentIndexTransforms[i]);
	}
	return transform;
};

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
	keyDown: {
		Shift: boolean;
		Command: boolean;
	};
}

export const renderWorkspace = (options: Omit<Options, "mousePosition">) => {
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
	const compositionSelection = compSelectionFromState(compositionId, compositionSelectionState);

	ctx.clearRect(0, 0, viewport.width, viewport.height);

	const pan = _pan.add(Vec2.new(viewport.width / 2, viewport.height / 2));

	ctx.beginPath();
	ctx.fillStyle = cssVariables.gray700;
	ctx.rect(pan.x, pan.y, composition.width * scale, composition.height * scale);
	ctx.fill();

	function renderLine(
		map: CompositionRenderValues,
		layer: Layer,
		indexTransforms: LayerTransform[],
		parentIndexTransforms: ParentIndexTransform[],
	) {
		const nameToProperty = getNameToProperty(map, compositionState, layer.id);

		const { Width, StrokeWidth, StrokeColor, LineCap } = nameToProperty;

		if (StrokeWidth === 0) {
			return;
		}

		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		const transform = computeLayerTransform(
			map.transforms[layer.id].transform,
			indexTransforms,
			parentIndexTransforms,
		);

		const mat2 = transform.matrix;

		const [p0, p1] = [
			[0, 0],
			[1, 0],
		].map(([tx, ty]) => {
			const x = tx * Width - transform.anchor.x;
			const y = ty * 0 - transform.anchor.y;
			return mat2.multiply(Vec2.new(x, y)).add(transform.translate).scale(scale).add(pan);
		});

		ctx.beginPath();
		ctx.moveTo(p0.x, p0.y);
		ctx.lineTo(p1.x, p1.y);
		ctx.lineCap = LineCap;
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth =
			StrokeWidth *
			scale *
			interpolate(Math.abs(transform.scaleX), Math.abs(transform.scaleY), 0.5);
		ctx.stroke();
	}

	function renderRectLayer(
		map: CompositionRenderValues,
		layer: Layer,
		indexTransforms: LayerTransform[],
		parentIndexTransforms: ParentIndexTransform[],
	) {
		const nameToProperty = getNameToProperty(map, compositionState, layer.id);

		const { Width, Height, Fill, StrokeWidth, StrokeColor } = nameToProperty;

		const fillColor = `rgba(${Fill.join(",")})`;
		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		const transform = computeLayerTransform(
			map.transforms[layer.id].transform,
			indexTransforms,
			parentIndexTransforms,
		);

		const mat2 = transform.matrix;

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
		ctx.closePath();
		ctx.fillStyle = fillColor;
		ctx.fill();

		if (StrokeWidth) {
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth =
				StrokeWidth *
				scale *
				interpolate(Math.abs(transform.scaleX), Math.abs(transform.scaleY), 0.5);
			ctx.stroke();
		}
	}

	function renderEllipse(
		map: CompositionRenderValues,
		layer: Layer,
		indexTransforms: LayerTransform[],
		parentIndexTransforms: ParentIndexTransform[],
	) {
		const nameToProperty = getNameToProperty(map, compositionState, layer.id);

		const { OuterRadius, InnerRadius, Fill, StrokeWidth, StrokeColor } = nameToProperty;

		const fillColor = `rgba(${Fill.join(",")})`;
		const strokeColor = `rgba(${StrokeColor.join(",")})`;

		const transform = computeLayerTransform(
			map.transforms[layer.id].transform,
			indexTransforms,
			parentIndexTransforms,
		);

		const [[ix, iy], [jx, jy]] = transform.matrix.matrix;

		const toPos = (_x: number, _y: number) => {
			const p = Vec2.new(_x, _y);

			const x = ix * p.x + jx * p.y + transform.translate.x;
			const y = iy * p.x + jy * p.y + transform.translate.y;

			return Vec2.new(x, y).scale(scale).add(pan);
		};

		const xLen = transform.matrix.multiplyVec2(Vec2.new(0, OuterRadius)).length();
		const yLen = transform.matrix.multiplyVec2(Vec2.new(OuterRadius, 0)).length();
		const angle = transform.matrix.getRotationAngle() + Math.PI / 2;

		const orX = Math.abs(xLen * scale);
		const orY = Math.abs(yLen * scale);
		const irX = Math.abs(InnerRadius * scale);
		const irY = Math.abs(InnerRadius * scale);

		const c = toPos(-transform.anchor.x, -transform.anchor.y);

		ctx.beginPath();
		ctx.ellipse(c.x, c.y, orX, orY, angle, 0, 2 * Math.PI);

		if (InnerRadius !== 0) {
			ctx.ellipse(c.x, c.y, irX, irY, angle, 0, 2 * Math.PI);
		}

		ctx.fillStyle = fillColor;
		ctx.fill("evenodd");
		ctx.closePath();

		if (StrokeWidth) {
			ctx.strokeStyle = strokeColor;
			ctx.lineWidth =
				StrokeWidth *
				scale *
				interpolate(Math.abs(transform.scaleX), Math.abs(transform.scaleY), 0.5);

			ctx.beginPath();
			ctx.ellipse(c.x, c.y, orX, orY, angle, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.closePath();

			ctx.beginPath();
			ctx.ellipse(c.x, c.y, irX, irY, angle, 0, 2 * Math.PI);
			ctx.stroke();
			ctx.closePath();
		}
	}

	function renderShapeLayer(
		map: CompositionRenderValues,
		layer: Layer,
		indexTransforms: LayerTransform[],
		parentIndexTransforms: ParentIndexTransform[],
	) {
		const shapeGroups = reduceLayerPropertiesAndGroups<PropertyGroup[]>(
			layer.id,
			compositionState,
			(acc, property) => {
				if (property.name === PropertyGroupName.Shape) {
					acc.push(property);
				}
				return acc;
			},
			[],
		).reverse();

		const transform = computeLayerTransform(
			map.transforms[layer.id].transform,
			indexTransforms,
			parentIndexTransforms,
		);

		const toPos = (vec: Vec2): Vec2 => {
			return transform.matrix
				.multiplyVec2(vec.sub(transform.anchor))
				.add(transform.translate)
				.scale(scale)
				.add(pan);
		};

		const pathIdToShapeGroupId = reduceLayerPropertiesAndGroups<{ [pathId: string]: string }>(
			layer.id,
			compositionState,
			(obj, group) => {
				if (group.name !== PropertyGroupName.Shape) {
					return obj;
				}
				let pathIndex = -1;
				for (let i = 0; i < group.properties.length; i++) {
					if (
						compositionState.properties[group.properties[i]].name ===
						PropertyName.ShapeLayer_Path
					) {
						pathIndex = i;
						break;
					}
				}
				if (pathIndex === -1) {
					return obj;
				}
				const pathPropertyId = group.properties[pathIndex];
				const property = compositionState.properties[pathPropertyId] as Property;
				const pathId = property.value;
				obj[pathId] = group.id;
				return obj;
			},
			{},
		);

		const onPath = (property: Property) => {
			const pathId = property.value;
			const path = shapeState.paths[pathId];
			const shapeGroupId = pathIdToShapeGroupId[pathId];
			const shapeSelected = compositionSelection.properties[shapeGroupId];
			const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
			const pathList = pathIdToCurves(
				pathId,
				shapeState,
				shapeSelectionState,
				shapeMoveVector,
				toPos,
			);

			if (!pathList) {
				return;
			}

			for (let i = 0; i < pathList.length; i++) {
				traceCurve(ctx, pathList[i], { move: i === 0 });
			}

			if (!path.items.length) {
				console.log(path);
				console.warn("Path with no items.");
				return;
			}

			// If items[0] has a left edge, the the path loops.
			if (path.items[0].left && path.items[0].left.edgeId) {
				ctx.closePath();
			}
		};

		const onFill = (group: PropertyGroup) => {
			const { color, fillRule } = getShapeFillGroupValues(group, compositionState);
			ctx.fillStyle = rgbaToString(color);
			ctx.fill(fillRule);
		};

		const onStroke = (group: PropertyGroup) => {
			const { color, lineCap, lineJoin, lineWidth, miterLimit } = getShapeStrokeGroupValues(
				group,
				compositionState,
			);

			if (lineWidth === 0) {
				return;
			}

			ctx.strokeStyle = rgbaToString(color);
			ctx.lineWidth =
				lineWidth *
				scale *
				interpolate(Math.abs(transform.scaleX), Math.abs(transform.scaleY), 0.5);
			ctx.miterLimit = miterLimit;
			ctx.lineCap = lineCap;
			ctx.lineJoin = lineJoin;
			ctx.stroke();
		};

		for (const group of shapeGroups) {
			ctx.beginPath();
			for (const propertyId of group.properties) {
				const property = compositionState.properties[propertyId];

				switch (property.name) {
					case PropertyName.ShapeLayer_Path: {
						onPath(property);
						break;
					}

					case PropertyGroupName.Fill: {
						onFill(property);
						break;
					}

					case PropertyGroupName.Stroke: {
						onStroke(property);
						break;
					}
				}
			}
			ctx.closePath();
		}
	}

	function renderCompositionChildren(
		map: CompositionRenderValues,
		compositionId: string,
		parentIndexTransforms: ParentIndexTransform[] = [],
	) {
		const composition = compositionState.compositions[compositionId];
		const layers = composition.layers.map((layerId) => compositionState.layers[layerId]);

		const renderLayer = (
			layer: Layer,
			indexTransforms: LayerTransform[],
			parentIndexTransforms: ParentIndexTransform[],
		) => {
			switch (layer.type) {
				case LayerType.Composition: {
					renderCompositionChildren(
						map.compositionLayers[layer.id],
						compositionState.compositionLayerIdToComposition[layer.id],
						parentIndexTransforms,
					);
					break;
				}
				case LayerType.Shape: {
					renderShapeLayer(map, layer, indexTransforms, parentIndexTransforms);
					break;
				}
				case LayerType.Rect: {
					renderRectLayer(map, layer, indexTransforms, parentIndexTransforms);
					break;
				}
				case LayerType.Ellipse: {
					renderEllipse(map, layer, indexTransforms, parentIndexTransforms);
					break;
				}
				case LayerType.Line: {
					renderLine(map, layer, indexTransforms, parentIndexTransforms);
					break;
				}
			}
		};

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];

			const arrayModifiers = getLayerArrayModifiers(layer.id, compositionState);

			if (!arrayModifiers.length) {
				renderLayer(layer, [], parentIndexTransforms);
				continue;
			}

			if (layer.type === LayerType.Composition) {
				function dimension(
					dimensionIndex: number,
					transforms: ParentIndexTransform[] = parentIndexTransforms,
				) {
					const mod = arrayModifiers[dimensionIndex];
					const count = Math.max(1, map.properties[mod.countId].computedValue);

					const hasAnotherDimension = !!arrayModifiers[dimensionIndex + 1];

					for (let i = 0; i < count; i++) {
						let layerTransform = map.transforms[layer.id].transform;
						const indexTransform =
							map.transforms[layer.id].indexTransforms[dimensionIndex][i];

						for (let j = 0; j < transforms.length; j++) {
							layerTransform = applyParentIndexTransform(
								layerTransform,
								transforms[j],
							);
						}

						const parentIndexTransformList: ParentIndexTransform[] = [
							...transforms,
							{ baseTransform: layerTransform, indexTransform },
						];

						if (hasAnotherDimension) {
							dimension(dimensionIndex + 1, parentIndexTransformList);
							continue;
						}

						renderLayer(layer, [], parentIndexTransformList);
					}
				}

				dimension(0);
				continue;
			}

			function dimension(dimensionIndex: number, transforms: LayerTransform[] = []) {
				const mod = arrayModifiers[dimensionIndex];
				const count = Math.max(1, map.properties[mod.countId].computedValue);

				const hasNext = !!arrayModifiers[dimensionIndex + 1];

				for (let i = 0; i < count; i++) {
					const indexTransform =
						map.transforms[layer.id].indexTransforms[dimensionIndex][i];

					if (hasNext) {
						dimension(dimensionIndex + 1, [...transforms, indexTransform]);
						continue;
					}

					const indexTransforms: LayerTransform[] = [...transforms, indexTransform];

					renderLayer(layer, indexTransforms, parentIndexTransforms);
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

	const selection = compSelectionFromState(composition.id, compositionSelectionState);
	const layers = composition.layers.map((layerId) => compositionState.layers[layerId]);

	const renderContext: RenderGuidesContext = {
		compositionState,
		hasHoveredLayer: false,
		pan,
		scale,
		composition,
		compositionSelection: selection,
		viewport,
		mousePosition: options.mousePosition,
		compositionSelectionState,
		isPerformingAction: options.isPerformingAction,
		shapeSelectionState,
		shapeState,
		tool: options.tool,
		keyDown: options.keyDown,
		nSelectedShapeLayers: composition.layers.filter((layerId) => {
			const layer = compositionState.layers[layerId];
			if (layer.type !== LayerType.Shape) {
				return false;
			}
			return selection.layers[layerId];
		}).length,
	};

	const hasSelectedPath =
		getCompositionSelectedPathsSet(compositionId, compositionState, compositionSelectionState)
			.size > 0 && renderContext.nSelectedShapeLayers === 1;

	for (const layer of layers) {
		if (layer.type === LayerType.Shape && renderContext.nSelectedShapeLayers === 1) {
			const directlySelectedPathIds = getShapeLayerDirectlySelectedPaths(
				layer.id,
				compositionState,
				compositionSelectionState,
			);

			if (!hasSelectedPath && directlySelectedPathIds.size === 0) {
				renderLayerGuides(renderContext, ctx, options.map, layer);
			}
			renderShapeLayerGuides(renderContext, ctx, options.map, layer);
			continue;
		}

		if (!hasSelectedPath && options.tool !== Tool.pen) {
			renderLayerGuides(renderContext, ctx, options.map, layer);
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
