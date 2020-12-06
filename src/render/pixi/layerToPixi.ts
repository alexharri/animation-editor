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
	pathIdToCurves,
} from "~/shape/shapeUtils";
import { LayerType, PropertyGroupName, PropertyName } from "~/types";
import { rgbToBinary } from "~/util/color/convertColor";

const shapeLayerToPixi = (actionState: ActionState, layer: Layer): PIXI.Container => {
	const graphic = new PIXI.Graphics();

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

	const onPath = (property: Property) => {
		const pathId = property.value;
		const path = shapeState.paths[pathId];
		const shapeGroupId = pathIdToShapeGroupId[pathId];
		const shapeSelected = compositionSelection.properties[shapeGroupId];
		const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
		const pathList = pathIdToCurves(pathId, shapeState, shapeSelectionState, shapeMoveVector);

		if (!pathList) {
			return;
		}

		const firstPath = pathList[0];

		if (firstPath) {
			graphic.moveTo(firstPath[0].x, firstPath[0].y);
		}

		for (let i = 0; i < pathList.length; i++) {
			const path = pathList[i];
			if (path.length === 2) {
				const [, p1] = path;
				graphic.lineTo(p1.x, p1.y);
			} else {
				const [, p1, p2, p3] = path;
				graphic.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
			}
		}

		if (!path.items.length) {
			console.log(path);
			console.warn("Path with no items.");
			return;
		}

		// If items[0] has a left edge, the the path loops.
		if (path.items[0].left && path.items[0].left.edgeId) {
			graphic.closePath();
		}
	};

	const onFill = (group: PropertyGroup) => {
		const { color } = getShapeFillGroupValues(group, compositionState);
		const [r, g, b, a] = color;
		graphic.beginFill(rgbToBinary([r, g, b]), a);
		graphic.fill;
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
		for (const property of properties) {
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
	}
	return graphic;
};

const rectLayerToPixi = (actionState: ActionState, layer: Layer): PIXI.Container => {
	const graphic = new PIXI.Graphics();

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

	const width = propertyUtil.getValue(wp.id);
	const height = propertyUtil.getValue(hp.id);
	const fill = propertyUtil.getValue(fp.id);
	const [r, g, b, a] = fill;
	graphic.beginFill(rgbToBinary([r, g, b]), a);
	graphic.drawRect(0, 0, width, height);

	return graphic;
};

const createGraphic = (actionState: ActionState, layer: Layer): PIXI.Container => {
	switch (layer.type) {
		case LayerType.Shape:
			return shapeLayerToPixi(actionState, layer);
		case LayerType.Rect:
			return rectLayerToPixi(actionState, layer);
	}
	throw new Error("Not implemented");
};

export const layerToPixi = (actionState: ActionState, layer: Layer): PIXI.Container => {
	const graphic = createGraphic(actionState, layer);
	const transform = layerUtils.getTransform(layer.id);
	graphic.scale.set(transform.scaleX, transform.scaleY);
	graphic.rotation = transform.rotation * DEG_TO_RAD_FAC;
	graphic.position.set(transform.translate.x, transform.translate.y);
	graphic.pivot.set(transform.anchor.x, transform.anchor.y);
	return graphic;
};
