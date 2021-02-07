import { Layer } from "~/composition/compositionTypes";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { getPathIdToShapeGroupId, getShapeLayerPathIds, pathIdToCurves } from "~/shape/shapeUtils";
import { LayerType, PropertyName } from "~/types";
import { boundingRectOfRects } from "~/util/math";
import { pathBoundingRect } from "~/util/math/boundingRect";

type GetLayerDimensionsStateRequired = Pick<
	ActionState,
	"compositionState" | "compositionSelectionState" | "shapeState" | "shapeSelectionState"
>;

const getShapeLayerBoundingRect = (
	state: GetLayerDimensionsStateRequired,
	layer: Layer,
): Rect | null => {
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
	layer: Layer,
	nameToProperty: { [key in keyof typeof PropertyName]: any },
	state: GetLayerDimensionsStateRequired,
) => {
	let width: number;
	let height: number;
	let offX = 0;
	let offY = 0;

	switch (layer.type) {
		case LayerType.Composition: {
			width = nameToProperty.Width;
			height = nameToProperty.Height;
			break;
		}

		case LayerType.Shape: {
			const rect = getShapeLayerBoundingRect(state, layer);

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
			width = nameToProperty.Width;
			height = nameToProperty.Height;
			break;
		}

		case LayerType.Ellipse: {
			width = nameToProperty.OuterRadius * 2;
			height = nameToProperty.OuterRadius * 2;
			break;
		}

		case LayerType.Line: {
			width = nameToProperty.Width;
			height = 2;
			offY -= 1;
		}
	}

	return [width, height, offX, offY];
};
