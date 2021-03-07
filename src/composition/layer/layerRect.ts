import { Layer } from "~/composition/compositionTypes";
import { getShapeLayerPathIds, pathIdToCurves } from "~/shape/shapeUtils";
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
