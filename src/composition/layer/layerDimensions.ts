import { Layer } from "~/composition/compositionTypes";
import {
	CompositionLayerPropertyMap,
	EllipseLayerPropertyMap,
	LayerPropertyMap,
	LineLayerPropertyMap,
	RectLayerPropertyMap,
} from "~/composition/layer/layerPropertyMap";
import { getShapeLayerPathIds, pathIdToCurves } from "~/shape/shapeUtils";
import { LayerType, PropertyName } from "~/types";
import { boundingRectOfRects } from "~/util/math";
import { pathBoundingRect } from "~/util/math/boundingRect";

const getShapeLayerBoundingRect = (state: ActionState, layer: Layer): Rect | null => {
	const { compositionState, shapeState } = state;

	const pathIds = getShapeLayerPathIds(layer.id, compositionState);

	const rects = pathIds
		.map((pathId) => {
			return pathIdToCurves(pathId, shapeState)!;
		})
		.filter(Boolean)
		.map((curves) => pathBoundingRect(curves)!)
		.filter(Boolean);
	return boundingRectOfRects(rects);
};

export const getLayerRectDimensionsAndOffset = (
	actionState: ActionState,
	layer: Layer,
	propertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
) => {
	let width: number;
	let height: number;
	let offX = 0;
	let offY = 0;

	switch (layer.type) {
		case LayerType.Composition: {
			const map = propertyMap as CompositionLayerPropertyMap;
			width = getPropertyValue(map[PropertyName.Width]);
			height = getPropertyValue(map[PropertyName.Height]);
			break;
		}

		case LayerType.Shape: {
			const rect = getShapeLayerBoundingRect(actionState, layer);

			if (rect) {
				width = rect.width;
				height = rect.height;
				offX = rect.left;
				offY = rect.top;
			} else {
				width = 50;
				height = 50;
			}

			break;
		}

		case LayerType.Rect: {
			const map = propertyMap as RectLayerPropertyMap;
			width = getPropertyValue(map[PropertyName.Width]);
			height = getPropertyValue(map[PropertyName.Height]);
			break;
		}

		case LayerType.Ellipse: {
			const map = propertyMap as EllipseLayerPropertyMap;
			const outerRadius = getPropertyValue(map[PropertyName.OuterRadius]);
			width = outerRadius * 2;
			height = outerRadius * 2;
			offX = -outerRadius;
			offY = -outerRadius;
			break;
		}

		case LayerType.Line: {
			const map = propertyMap as LineLayerPropertyMap;
			width = getPropertyValue(map[PropertyName.Width]);
			height = 2;
			offY -= 1;
			break;
		}

		default:
			throw new Error(`Unexpected layer type '${layer.type}'.`);
	}

	return [width, height, offX, offY];
};

export const getLayerRect = (
	actionState: ActionState,
	layer: Layer,
	propertyMap: LayerPropertyMap,
	getPropertyValue: (propertyId: string) => any,
): Rect => {
	let width: number;
	let height: number;
	let left = 0;
	let top = 0;

	switch (layer.type) {
		case LayerType.Composition: {
			const map = propertyMap as CompositionLayerPropertyMap;
			width = getPropertyValue(map[PropertyName.Width]);
			height = getPropertyValue(map[PropertyName.Height]);
			break;
		}

		case LayerType.Shape: {
			const rect = getShapeLayerBoundingRect(actionState, layer);

			if (rect) {
				width = rect.width;
				height = rect.height;
				left = rect.left;
				top = rect.top;
			} else {
				width = 50;
				height = 50;
			}

			break;
		}

		case LayerType.Rect: {
			const map = propertyMap as RectLayerPropertyMap;
			width = getPropertyValue(map[PropertyName.Width]);
			height = getPropertyValue(map[PropertyName.Height]);
			break;
		}

		case LayerType.Ellipse: {
			const map = propertyMap as EllipseLayerPropertyMap;
			const outerRadius = getPropertyValue(map[PropertyName.OuterRadius]);
			width = outerRadius * 2;
			height = outerRadius * 2;
			left = -outerRadius;
			top = -outerRadius;
			break;
		}

		case LayerType.Line: {
			const map = propertyMap as LineLayerPropertyMap;
			width = getPropertyValue(map[PropertyName.Width]);
			height = 2;
			top -= 1;
			break;
		}

		default:
			throw new Error(`Unexpected layer type '${layer.type}'.`);
	}

	return { left, top, width, height };
};
