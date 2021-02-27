import * as PIXI from "pixi.js";
import { Layer } from "~/composition/compositionTypes";
import {
	constructLayerPropertyMap,
	EllipseLayerPropertyMap,
	LayerPropertyMap,
	RectLayerPropertyMap,
	ShapeLayerPropertyMap,
} from "~/composition/layer/layerPropertyMap";
import {
	updateEllipseHitTestLayerGraphic,
	updateEllipseLayerGraphic,
} from "~/render/pixi/ellipseLayerGraphic";
import {
	updateRectLayerGraphic,
	updateRectLayerHitTestGraphic,
} from "~/render/pixi/rectLayerGraphic";
import {
	updateShapeLayerGraphic,
	updateShapeLayerHitTestGraphic,
} from "~/render/pixi/shapeLayerGraphic";
import { LayerType } from "~/types";

export type UpdateGraphicFn<T extends LayerPropertyMap = LayerPropertyMap> = (
	actionState: ActionState,
	layer: Layer,
	graphic: PIXI.Graphics,
	map: T,
	getPropertyValue: (propertyId: string) => any,
) => void;

const updateLayerGraphic: UpdateGraphicFn = (
	actionState,
	layer,
	graphic,
	map,
	getPropertyValue,
) => {
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

const updateLayerHitTestGraphic: UpdateGraphicFn = (
	actionState,
	layer,
	graphic,
	map,
	getPropertyValue,
) => {
	switch (layer.type) {
		case LayerType.Shape:
			return updateShapeLayerHitTestGraphic(
				actionState,
				layer,
				graphic,
				map as ShapeLayerPropertyMap,
				getPropertyValue,
			);
		case LayerType.Rect:
			return updateRectLayerHitTestGraphic(
				actionState,
				layer,
				graphic,
				map as RectLayerPropertyMap,
				getPropertyValue,
			);
		case LayerType.Ellipse:
			return updateEllipseHitTestLayerGraphic(
				actionState,
				layer,
				graphic,
				map as EllipseLayerPropertyMap,
				getPropertyValue,
			);
	}
	throw new Error("Not implemented");
};

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

export const updatePixiLayerHitTestGraphic = (
	actionState: ActionState,
	layer: Layer,
	graphic: PIXI.Graphics,
	getPropertyValue: (propertyId: string) => any,
): void => {
	const map = constructLayerPropertyMap(layer.id, actionState.compositionState);
	graphic.clear();
	updateLayerHitTestGraphic(actionState, layer, graphic, map, getPropertyValue);
};
