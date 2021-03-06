import { Layer } from "~/composition/compositionTypes";
import {
	CompositionLayerPropertyMap,
	EllipseLayerPropertyMap,
	LayerPropertyMap,
	LineLayerPropertyMap,
	RectLayerPropertyMap,
} from "~/composition/layer/layerPropertyMap";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { getPathIdToShapeGroupId, getShapeLayerPathIds, pathIdToCurves } from "~/shape/shapeUtils";
import { LayerType, PropertyName } from "~/types";
import { boundingRectOfRects } from "~/util/math";
import { pathBoundingRect } from "~/util/math/boundingRect";

const getShapeLayerBoundingRect = (state: ActionState, layer: Layer): Rect | null => {
	const { compositionState, compositionSelectionState, shapeState, shapeSelectionState } = state;

	const pathIdToShapeGroupId = getPathIdToShapeGroupId(layer.id, compositionState);

	const pathIds = getShapeLayerPathIds(layer.id, compositionState);
	const composition = compositionState.compositions[layer.compositionId];
	const compositionSelection = compSelectionFromState(composition.id, compositionSelectionState);

	const rects = pathIds
		.map((pathId) => {
			const shapeGroupId = pathIdToShapeGroupId[pathId];
			const shapeSelected = compositionSelection.properties[shapeGroupId];
			const shapeMoveVector = shapeSelected ? composition.shapeMoveVector : Vec2.ORIGIN;
			return pathIdToCurves(pathId, shapeState, shapeSelectionState, shapeMoveVector)!;
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
