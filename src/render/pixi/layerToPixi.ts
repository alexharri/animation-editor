import * as PIXI from "pixi.js";
import { Layer, Property, PropertyGroup } from "~/composition/compositionTypes";
import { reduceLayerPropertiesAndGroups } from "~/composition/compositionUtils";
import { layerUtils } from "~/composition/layer/layerUtils";
import { propertyUtil } from "~/composition/property/propertyUtil";
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

const shapeLayerToPixi = (actionState: ActionState, layer: Layer, container: PIXI.Container) => {
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

const rectLayerToPixi = (actionState: ActionState, layer: Layer, container: PIXI.Container) => {
	const graphic = new PIXI.Graphics();
	container.addChild(graphic);

	const { compositionState } = actionState;

	const wp = layerUtils.findLayerProperty(
		PropertyGroupName.Dimensions,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.Width;
		},
	)!;
	const hp = layerUtils.findLayerProperty(
		PropertyGroupName.Dimensions,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.Height;
		},
	)!;
	const fp = layerUtils.findLayerProperty(
		PropertyGroupName.Content,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.Fill;
		},
	)!;
	const sp = layerUtils.findLayerProperty(
		PropertyGroupName.Content,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.StrokeColor;
		},
	)!;
	const swp = layerUtils.findLayerProperty(
		PropertyGroupName.Content,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.StrokeWidth;
		},
	)!;

	const width = propertyUtil.getValue(wp.id);
	const height = propertyUtil.getValue(hp.id);
	const fill = propertyUtil.getValue(fp.id);
	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	const strokeWidth = propertyUtil.getValue(swp.id);
	const strokeColor = propertyUtil.getValue(sp.id);
	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineTextureStyle({
			color: rgbToBinary([r, g, b]),
			alpha: a,
			width: strokeWidth,
		});
	}

	graphic.drawRect(0, 0, width, height);

	return graphic;
};

const ellipseLayerToPixi = (actionState: ActionState, layer: Layer, container: PIXI.Container) => {
	const graphic = new PIXI.Graphics();
	container.addChild(graphic);

	const { compositionState } = actionState;

	const orp = layerUtils.findLayerProperty(
		PropertyGroupName.Structure,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.OuterRadius;
		},
	)!;
	// const irp = layerUtils.findLayerProperty(
	// 	PropertyGroupName.Structure,
	// 	layer.id,
	// 	compositionState,
	// 	(property) => {
	// 		return property.name === PropertyName.InnerRadius;
	// 	},
	// )!;
	const fp = layerUtils.findLayerProperty(
		PropertyGroupName.Content,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.Fill;
		},
	)!;
	const sp = layerUtils.findLayerProperty(
		PropertyGroupName.Content,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.StrokeColor;
		},
	)!;
	const swp = layerUtils.findLayerProperty(
		PropertyGroupName.Content,
		layer.id,
		compositionState,
		(property) => {
			return property.name === PropertyName.StrokeWidth;
		},
	)!;

	const outerRadius = propertyUtil.getValue(orp.id);
	// const innerRadius = propertyUtil.getValue(irp.id);
	const fill = propertyUtil.getValue(fp.id);
	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);

	const strokeWidth = propertyUtil.getValue(swp.id);
	const strokeColor = propertyUtil.getValue(sp.id);
	if (strokeWidth > 0) {
		const [r, g, b, a] = strokeColor;
		graphic.lineTextureStyle({
			color: rgbToBinary([r, g, b]),
			alpha: a,
			width: strokeWidth,
		});
	}

	graphic.drawEllipse(0, 0, outerRadius, outerRadius);

	return graphic;
};

const setContent = (actionState: ActionState, layer: Layer, container: PIXI.Container) => {
	switch (layer.type) {
		case LayerType.Shape:
			return shapeLayerToPixi(actionState, layer, container);
		case LayerType.Rect:
			return rectLayerToPixi(actionState, layer, container);
		case LayerType.Ellipse:
			return ellipseLayerToPixi(actionState, layer, container);
		case LayerType.Composition:
			return container;
	}
	throw new Error("Not implemented");
};

export const layerToPixi = (actionState: ActionState, layer: Layer): PIXI.Container => {
	const container = new PIXI.Container();
	setContent(actionState, layer, container);
	const transform = layerUtils.getTransform(layer.id);
	container.scale.set(transform.scaleX, transform.scaleY);
	container.rotation = transform.rotation * DEG_TO_RAD_FAC;
	container.position.set(transform.translate.x, transform.translate.y);
	container.pivot.set(transform.anchor.x, transform.anchor.y);
	return container;
};

export const updatePixiLayerContent = (
	actionState: ActionState,
	layer: Layer,
	container: PIXI.Container,
) => {
	for (const child of container.children) {
		container.removeChild(child);
		child.destroy();
	}
	setContent(actionState, layer, container);
};
