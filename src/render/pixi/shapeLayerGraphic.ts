import { Point2D } from "kld-affine";
import { CubicBezier2D } from "kld-contours";
import { Layer, Property, PropertyGroup } from "~/composition/compositionTypes";
import { reduceLayerPropertiesAndGroups } from "~/composition/compositionUtils";
import { ShapeLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { UpdateGraphicFn } from "~/render/pixi/layerToPixi";
import { pixiLineCap, pixiLineJoin } from "~/render/pixi/pixiConstants";
import {
	getShapeFillGroupValues,
	getShapeStrokeGroupValues,
	isShapePathClosed,
	pathIdToCurves,
} from "~/shape/shapeUtils";
import { PropertyGroupName, PropertyName } from "~/types";
import { hslToRGB, rgbToBinary } from "~/util/color/convertColor";
import { outlineLine } from "~/util/math";
import { newTess } from "~/util/math/newTess";

const _Bezier = require("bezier-js").Bezier; // eslint-disable-line
const Bezier = _Bezier as typeof import("bezier-js");

const computePathIdToShapeGroupId = (actionState: ActionState, layerId: string) => {
	const { compositionState } = actionState;

	return reduceLayerPropertiesAndGroups<{ [pathId: string]: string }>(
		layerId,
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
};

const tracePath = (graphic: PIXI.Graphics, curves: Curve[]) => {
	const closedPaths = newTess(curves);

	for (const path of closedPaths) {
		const first = path[0];
		if (first) {
			const [x, y] = first;
			graphic.moveTo(x, y);
		}

		for (const [x, y] of path.slice(1)) {
			graphic.lineTo(x, y);
		}
	}
};

const traceStroke = (graphic: PIXI.Graphics, curves: Curve[]) => {
	const firstCurve = curves[0];
	if (firstCurve) {
		const { x, y } = firstCurve[0];
		graphic.moveTo(x, y);
	}
	for (const curve of curves) {
		if (curve.length === 2) {
			const { x, y } = curve[1];
			graphic.lineTo(x, y);
			continue;
		}

		const points = new CubicBezier2D(...curve.map((p) => new Point2D(p.x, p.y))).toPolygon2D()
			.points as Array<{ x: number; y: number }>;

		for (const { x, y } of points) {
			graphic.lineTo(x, y);
		}
	}
};

const getShapeGroups = (actionState: ActionState, layer: Layer) => {
	return reduceLayerPropertiesAndGroups<PropertyGroup[]>(
		layer.id,
		actionState.compositionState,
		(acc, property) => {
			if (property.name === PropertyGroupName.Shape) {
				acc.push(property);
			}
			return acc;
		},
		[],
	).reverse();
};

const createCurveGetter = (actionState: ActionState, layer: Layer) => {
	const {
		compositionState,
		compositionSelectionState,
		shapeState,
		shapeSelectionState,
	} = actionState;
	const composition = compositionState.compositions[layer.compositionId];
	const compositionSelection = compSelectionFromState(
		layer.compositionId,
		compositionSelectionState,
	);
	const pathIdToShapeGroupId = computePathIdToShapeGroupId(actionState, layer.id);

	return (property: Property) => {
		const pathId = property.value;

		const shapeGroupId = pathIdToShapeGroupId[pathId];
		const shapeSelected = compositionSelection.properties[shapeGroupId];
		const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
		const curves =
			pathIdToCurves(pathId, shapeState, shapeSelectionState, shapeMoveVector) || [];

		const path = shapeState.paths[pathId];
		const isClosed = isShapePathClosed(path);

		return { curves, isClosed };
	};
};

export const updateShapeLayerGraphic: UpdateGraphicFn<ShapeLayerPropertyMap> = (
	actionState,
	layer,
	graphic,
	_,
	_getPropertyValue,
) => {
	const { compositionState } = actionState;

	const shapeGroups = getShapeGroups(actionState, layer);
	const getCurves = createCurveGetter(actionState, layer);

	const onPath = (property: Property, options: { forStroke: boolean }) => {
		const { curves, isClosed } = getCurves(property);

		if (curves.length === 0) {
			return;
		}

		if (!options.forStroke) {
			tracePath(graphic, curves);
		} else {
			traceStroke(graphic, curves);
		}

		isClosed && graphic.closePath();

		if (options.forStroke) {
			graphic.moveTo(0, 0);
		}
	};

	const onFill = (group: PropertyGroup) => {
		const { color, opacity } = getShapeFillGroupValues(group, compositionState);
		const [r, g, b] = color;
		graphic.beginFill(rgbToBinary([r, g, b]), opacity);
	};

	const onStroke = (group: PropertyGroup) => {
		const {
			color,
			opacity,
			lineCap,
			lineJoin,
			lineWidth,
			miterLimit,
		} = getShapeStrokeGroupValues(group, compositionState);

		if (lineWidth === 0) {
			return;
		}

		const [r, g, b] = color;
		graphic.lineTextureStyle({
			cap: pixiLineCap(lineCap),
			join: pixiLineJoin(lineJoin),
			miterLimit,
			color: rgbToBinary([r, g, b]),
			alpha: opacity,
			width: lineWidth,
		});
	};

	for (const group of shapeGroups) {
		const properties = group.properties.map(
			(propertyId) => compositionState.properties[propertyId],
		);

		// Draw fills
		for (const property of properties) {
			switch (property.name) {
				case PropertyGroupName.Fill: {
					onFill(property);
					break;
				}
				case PropertyName.ShapeLayer_Path: {
					onPath(property, { forStroke: false });
					break;
				}
			}
		}
		graphic.endFill();

		// Draw stroke
		for (const property of properties) {
			switch (property.name) {
				case PropertyGroupName.Stroke: {
					onStroke(property);
					break;
				}
				case PropertyName.ShapeLayer_Path: {
					onPath(property, { forStroke: true });
					break;
				}
			}
		}
	}
};

export const updateShapeLayerHitTestGraphic: UpdateGraphicFn<ShapeLayerPropertyMap> = (
	actionState,
	layer,
	graphic,
	_,
	_getPropertyValue,
) => {
	const { compositionState } = actionState;
	const shapeGroups = getShapeGroups(actionState, layer);
	const getCurves = createCurveGetter(actionState, layer);

	let drawStrokes = false;
	let drawFills = false;
	let strokeWidth = 0;

	const onPath = (property: Property) => {
		if (!drawFills && !drawStrokes) {
			return;
		}

		const { curves, isClosed } = getCurves(property);

		if (curves.length === 0) {
			return;
		}

		if (drawFills) {
			graphic.beginFill(rgbToBinary(hslToRGB([300, 80, 76])), 1);
			tracePath(graphic, curves);
			isClosed && graphic.closePath();
			graphic.endFill();
		}

		if (drawStrokes) {
			const firstCurve = curves[0];
			if (firstCurve) {
				const { x, y } = firstCurve[0];
				graphic.moveTo(x, y);
			}

			for (let i = 0; i < curves.length; i++) {
				const curve = curves[i];
				graphic.beginFill(rgbToBinary(hslToRGB([(i * 30) % 360, 80, 76])), 1);

				if (curve.length === 2) {
					const points = outlineLine(curve, strokeWidth);
					graphic.moveTo(points[3].x, points[3].y);
					graphic.lineTo(points[0].x, points[0].y);
					graphic.lineTo(points[1].x, points[1].y);
					graphic.lineTo(points[2].x, points[2].y);
					graphic.closePath();
					graphic.endFill();
					continue;
				}

				const [p0, p1, p2, p3] = curve;
				const bez = new Bezier(p0, p1, p2, p3);
				const outline = bez.outline(strokeWidth);

				const points: Vec2[] = [];

				for (const item of outline.curves) {
					const curve = item.points;
					const result = new CubicBezier2D(
						new Point2D(curve[0].x, curve[0].y),
						new Point2D(curve[1].x, curve[1].y),
						new Point2D(curve[2].x, curve[2].y),
						new Point2D(curve[3].x, curve[3].y),
					).toPolygon2D().points as Vec2[];
					points.push(...result);
				}

				const last = points[points.length - 1];
				graphic.moveTo(last.x, last.y);
				for (const point of points) {
					graphic.lineTo(point.x, point.y);
				}
				graphic.endFill();
			}
		}
	};

	const onFill = (group: PropertyGroup) => {
		const { opacity } = getShapeFillGroupValues(group, compositionState);
		if (opacity > 0) {
			drawFills = true;
		}
	};

	const onStroke = (group: PropertyGroup) => {
		const { opacity, lineWidth } = getShapeStrokeGroupValues(group, compositionState);
		drawStrokes = lineWidth > 0 && opacity > 0;
		strokeWidth = lineWidth;
	};

	for (const group of shapeGroups) {
		const properties = group.properties.map(
			(propertyId) => compositionState.properties[propertyId],
		);

		// Draw fill
		for (const property of properties) {
			switch (property.name) {
				case PropertyGroupName.Fill: {
					onFill(property);
					break;
				}
				case PropertyGroupName.Stroke: {
					onStroke(property);
					break;
				}
				case PropertyName.ShapeLayer_Path: {
					onPath(property);
					break;
				}
			}
		}
		graphic.endFill();
	}
};
