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
import { DEG_TO_RAD_FAC } from "~/constants";
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
	map: T,
	container: PIXI.Container,
	getPropertyValue: (propertyId: string) => any,
) => void;

const shapeLayerToPixi: Fn<ShapeLayerPropertyMap> = (
	actionState,
	layer,
	_,
	container,
	getPropertyValue,
) => {
	const graphic = new PIXI.Graphics();
	container.addChild(graphic);

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

const createResolver = (
	actionState: ActionState,
	map: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
) => (propertyName: PropertyName) => {
	const { compositionState } = actionState;

	const propertyId = (map as any)[propertyName];
	return getPropertyValue(propertyId);
	// const property = compositionState.properties[propertyId] as Property;

	// if (!property.timelineId) {
	// 	return property.value;
	// }

	// const layer = compositionState.layers[property.layerId];
	// const composition = compositionState.compositions[property.compositionId];
	// return getTimelineValueAtIndex({
	// 	timeline: actionState.timelineState[property.timelineId],
	// 	selection: actionState.timelineSelectionState[property.timelineId],
	// 	frameIndex: composition.frameIndex,
	// 	layerIndex: layer.index,
	// });
};

const rectLayerToPixi: Fn<RectLayerPropertyMap> = (
	actionState,
	_layer,
	map,
	container,
	getPropertyValue,
) => {
	const graphic = new PIXI.Graphics();
	container.addChild(graphic);

	const resolve = createResolver(actionState, map, getPropertyValue);

	const width = resolve(PropertyName.Width);
	const height = resolve(PropertyName.Height);
	const fill = resolve(PropertyName.Fill);
	const strokeColor = resolve(PropertyName.StrokeColor);
	const strokeWidth = resolve(PropertyName.StrokeWidth);

	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineTextureStyle({ color: rgbToBinary([r, g, b]), alpha: a, width: strokeWidth });
	}

	graphic.drawRect(0, 0, width, height);

	return graphic;
};

const ellipseLayerToPixi: Fn<EllipseLayerPropertyMap> = (
	actionState,
	_layer,
	map,
	container,
	getPropertyValue,
) => {
	const graphic = new PIXI.Graphics();
	container.addChild(graphic);

	const resolve = createResolver(actionState, map, getPropertyValue);

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

	return graphic;
};

const setContent: Fn = (actionState, layer, map, container, getPropertyValue) => {
	switch (layer.type) {
		case LayerType.Shape:
			return shapeLayerToPixi(
				actionState,
				layer,
				map as ShapeLayerPropertyMap,
				container,
				getPropertyValue,
			);
		case LayerType.Rect:
			return rectLayerToPixi(
				actionState,
				layer,
				map as RectLayerPropertyMap,
				container,
				getPropertyValue,
			);
		case LayerType.Ellipse:
			return ellipseLayerToPixi(
				actionState,
				layer,
				map as EllipseLayerPropertyMap,
				container,
				getPropertyValue,
			);
		case LayerType.Composition:
			return container;
	}
	throw new Error("Not implemented");
};

export const layerToPixi = (
	actionState: ActionState,
	layer: Layer,
	getPropertyValue: (propertyId: string) => any,
): PIXI.Container => {
	const container = new PIXI.Container();

	const map = constructLayerPropertyMap(layer.id, actionState.compositionState);

	const resolve = createResolver(actionState, map, getPropertyValue);

	const positionX = resolve(PropertyName.PositionX);
	const positionY = resolve(PropertyName.PositionY);
	const anchorX = resolve(PropertyName.AnchorX);
	const anchorY = resolve(PropertyName.AnchorY);
	const scaleX = resolve(PropertyName.ScaleX);
	const scaleY = resolve(PropertyName.ScaleY);
	const rotation = resolve(PropertyName.Rotation);

	setContent(actionState, layer, map, container, getPropertyValue);
	container.scale.set(scaleX, scaleY);
	container.rotation = rotation * DEG_TO_RAD_FAC;
	container.position.set(positionX, positionY);
	container.pivot.set(anchorX, anchorY);
	return container;
};

export const updatePixiLayerContent = (
	actionState: ActionState,
	layer: Layer,
	container: PIXI.Container,
	getPropertyValue: (propertyId: string) => any,
) => {
	const map = constructLayerPropertyMap(layer.id, actionState.compositionState);
	for (const child of container.children) {
		container.removeChild(child);
		child.destroy();
	}
	setContent(actionState, layer, map, container, getPropertyValue);
};
