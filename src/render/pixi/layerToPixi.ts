import * as PIXI from "pixi.js";
import { Layer, Property, PropertyGroup } from "~/composition/compositionTypes";
import { reduceLayerPropertiesAndGroups } from "~/composition/compositionUtils";
import {
	constructLayerPropertyMap,
	EllipseLayerPropertyMap,
	LayerPropertyMap,
	RectLayerPropertyMap,
	ShapeLayerPropertyMap,
} from "~/composition/layer/layerPropertyMap";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { pixiLineCap, pixiLineJoin } from "~/render/pixi/pixiConstants";
import {
	getShapeFillGroupValues,
	getShapeStrokeGroupValues,
	isShapePathClosed,
	pathIdToCurves,
} from "~/shape/shapeUtils";
import { LayerType, PropertyGroupName, PropertyName } from "~/types";
import { rgbToBinary } from "~/util/color/convertColor";
import { newTess } from "~/util/math/newTess";

type Fn<T extends LayerPropertyMap = LayerPropertyMap> = (
	actionState: ActionState,
	layer: Layer,
	graphic: PIXI.Graphics,
	map: T,
	getPropertyValue: (propertyId: string) => any,
) => void;

const createResolver = (map: LayerPropertyMap, getPropertyValue: (propertyId: string) => any) => (
	propertyName: PropertyName,
) => {
	const propertyId = (map as any)[propertyName];
	return getPropertyValue(propertyId);
};

const updateShapeLayerGraphic: Fn<ShapeLayerPropertyMap> = (
	actionState,
	layer,
	graphic,
	_,
	_getPropertyValue,
) => {
	const {
		shapeState,
		shapeSelectionState,
		compositionState,
		compositionSelectionState,
	} = actionState;
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

	const composition = compositionState.compositions[layer.compositionId];
	const compositionSelection = compSelectionFromState(
		layer.compositionId,
		compositionSelectionState,
	);

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

	const onPath = (property: Property, forStroke = false) => {
		const pathId = property.value;
		const path = shapeState.paths[pathId];
		const shapeGroupId = pathIdToShapeGroupId[pathId];
		const shapeSelected = compositionSelection.properties[shapeGroupId];
		const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
		const curves = pathIdToCurves(pathId, shapeState, shapeSelectionState, shapeMoveVector);

		const isClosed = isShapePathClosed(path);

		if (!curves || curves.length === 0) {
			return;
		}

		if (!forStroke) {
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
		} else {
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
				const [, p1, p2, p3] = curve;
				graphic.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
			}
		}

		if (isClosed) {
			graphic.closePath();
		}
	};

	const onFill = (group: PropertyGroup) => {
		const { color } = getShapeFillGroupValues(group, compositionState);
		const [r, g, b, a] = color;
		graphic.beginFill(rgbToBinary([r, g, b]), a);
	};

	const onStroke = (group: PropertyGroup) => {
		const { color, lineCap, lineJoin, lineWidth, miterLimit } = getShapeStrokeGroupValues(
			group,
			compositionState,
		);

		if (lineWidth === 0) {
			return;
		}

		const [r, g, b, a] = color;
		// graphic.lineStyle(lineWidth, rgbToBinary([r,g,b]), a);
		graphic.lineTextureStyle({
			cap: pixiLineCap(lineCap),
			join: pixiLineJoin(lineJoin),
			miterLimit,
			color: rgbToBinary([r, g, b]),
			alpha: a,
			width: lineWidth,
		});
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
				case PropertyName.ShapeLayer_Path: {
					onPath(property);
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
					onPath(property, true);
					break;
				}
			}
		}
	}
};

const updateRectLayerGraphic: Fn<RectLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const resolve = createResolver(map, getPropertyValue);

	const width = resolve(PropertyName.Width);
	const height = resolve(PropertyName.Height);
	const fill = resolve(PropertyName.Fill);
	const strokeColor = resolve(PropertyName.StrokeColor);
	const strokeWidth = resolve(PropertyName.StrokeWidth);
	let borderRadius = resolve(PropertyName.BorderRadius);

	borderRadius = Math.max(0, Math.min(width / 2 - 0.01, height / 2 - 0.01, borderRadius));

	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineStyle(strokeWidth, rgbToBinary([r, g, b]), a);
	}

	if (borderRadius > 0) {
		graphic.drawRoundedRect(0, 0, width, height, borderRadius);
	} else {
		graphic.drawRect(0, 0, width, height);
	}

	graphic.endFill();

	return graphic;
};

const updateEllipseLayerGraphic: Fn<EllipseLayerPropertyMap> = (
	_actionState,
	_layer,
	graphic,
	map,
	getPropertyValue,
) => {
	const resolve = createResolver(map, getPropertyValue);

	const outerRadius = resolve(PropertyName.OuterRadius);
	const fill = resolve(PropertyName.Fill);
	const strokeWidth = resolve(PropertyName.StrokeWidth);
	const strokeColor = resolve(PropertyName.StrokeColor);

	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineTextureStyle({ color: rgbToBinary([r, g, b]), alpha: a, width: strokeWidth });
	}

	graphic.drawEllipse(0, 0, outerRadius, outerRadius);
};

const updateLayerGraphic: Fn = (actionState, layer, graphic, map, getPropertyValue) => {
	switch (layer.type) {
		case LayerType.Shape:
			return updateShapeLayerGraphic(
				actionState,
				layer,
				graphic,
				map as ShapeLayerPropertyMap,
				getPropertyValue,
			);
		case LayerType.Rect:
			return updateRectLayerGraphic(
				actionState,
				layer,
				graphic,
				map as RectLayerPropertyMap,
				getPropertyValue,
			);
		case LayerType.Ellipse:
			return updateEllipseLayerGraphic(
				actionState,
				layer,
				graphic,
				map as EllipseLayerPropertyMap,
				getPropertyValue,
			);
	}
	throw new Error("Not implemented");
};

// export const layerToPixi = (
// 	actionState: ActionState,
// 	layer: Layer,
// 	getPropertyValue: (propertyId: string) => any,
// ): {
// 	transformContainer: PIXI.Container;
// 	ownContentContainer: PIXI.Container;
// 	childLayerContainer: PIXI.Container;
// 	container: PIXI.Container; // The same as `graphic` if non-composition layer
// 	graphic: PIXI.Graphics;
// } => {
// 	const transformContainer = new PIXI.Container();
// 	const ownContentContainer = new PIXI.Container();
// 	const childLayerContainer = new PIXI.Container();

// 	// The layer's transform affects both its own content and the content
// 	// of its child layers, so we add both to the transform container.
// 	transformContainer.addChild(ownContentContainer);
// 	transformContainer.addChild(childLayerContainer);

// 	const map = constructLayerPropertyMap(layer.id, actionState.compositionState);
// 	const resolve = createResolver(map, getPropertyValue);

// 	let container: PIXI.Container;
// 	let graphic: PIXI.Graphics;

// 	if (layer.type === LayerType.Composition) {
// 		graphic = new PIXI.Graphics();
// 		container = new PIXI.Container();
// 	} else {
// 		graphic = updateLayerGraphic(actionState, layer, graphic, map, getPropertyValue);
// 		container = graphic;
// 	}

// 	return { transformContainer, childLayerContainer, ownContentContainer, container, graphic };
// };

export const getPixiLayerGraphic = (
	actionState: ActionState,
	layer: Layer,
	getPropertyValue: (propertyId: string) => any,
): PIXI.Graphics => {
	const graphic = new PIXI.Graphics();
	const map = constructLayerPropertyMap(layer.id, actionState.compositionState);
	updateLayerGraphic(actionState, layer, graphic, map, getPropertyValue);
	return graphic;
};

export const updatePixiLayerGraphic = (
	actionState: ActionState,
	layer: Layer,
	graphic: PIXI.Graphics,
	getPropertyValue: (propertyId: string) => any,
): void => {
	const map = constructLayerPropertyMap(layer.id, actionState.compositionState);
	graphic.clear();
	updateLayerGraphic(actionState, layer, graphic, map, getPropertyValue);
};
