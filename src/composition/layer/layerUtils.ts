import { CompositionState } from "~/composition/compositionReducer";
import { Layer } from "~/composition/compositionTypes";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { TIMELINE_HEADER_HEIGHT, TIMELINE_LAYER_HEIGHT } from "~/constants";
import { getPathIdToShapeGroupId, getShapeLayerPathIds, pathIdToCurves } from "~/shape/shapeUtils";
import { getTimelineTrackYPositions } from "~/trackEditor/trackEditorUtils";
import { LayerType, NameToProperty, PropertyName, PropertyValueMap } from "~/types";
import { boundingRectOfRects, isVecInRect } from "~/util/math";
import { pathBoundingRect } from "~/util/math/boundingRect";

const layerTypeToName: { [key in keyof typeof LayerType]: string } = {
	Ellipse: "Ellipse layer",
	Rect: "Rect layer",
	Composition: "Composition layer",
	Shape: "Shape layer",
	Line: "Line layer",
};

export const getLayerTypeName = (type: LayerType): string => {
	const key = LayerType[type] as keyof typeof LayerType;
	return layerTypeToName[key];
};

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

export const getLayerNameToProperty = (
	propertyValueMap: PropertyValueMap,
	compositionState: CompositionState,
	layerId: string,
) => {
	const properties = getLayerCompositionProperties(layerId, compositionState);

	const nameToProperty = properties.reduce<NameToProperty>((obj, p) => {
		const value = propertyValueMap[p.id];
		(obj as any)[PropertyName[p.name]] = value.computedValue;
		return obj;
	}, {} as any);

	return nameToProperty;
};

export const getPickWhipLayerTarget = (
	globalMousePosition: Vec2,
	fromLayerId: string,
	compositionId: string,
	compositionState: CompositionState,
	panY: number,
	viewport: Rect,
): {
	layerId: string;
} | null => {
	const yPosMap = getTimelineTrackYPositions(compositionId, compositionState, panY);

	const mousePos = globalMousePosition
		.subXY(viewport.left, viewport.top)
		.subY(TIMELINE_HEADER_HEIGHT);

	const layerIds = getValidLayerParentLayerIds(fromLayerId, compositionState);

	for (let i = 0; i < layerIds.length; i += 1) {
		const layerId = layerIds[i];
		if (layerId === fromLayerId) {
			continue;
		}

		const top = yPosMap.layer[layerId];

		const rect: Rect = {
			left: 0,
			top,
			height: TIMELINE_LAYER_HEIGHT,
			width: viewport.width,
		};

		if (isVecInRect(mousePos, rect)) {
			return { layerId: layerId };
		}
	}

	return null;
};

export const getValidLayerParentLayerIds = (
	layerId: string,
	compositionState: CompositionState,
) => {
	const layer = compositionState.layers[layerId];
	const composition = compositionState.compositions[layer.compositionId];
	const layerIds = composition.layers.filter((id) => id !== layer.id);

	const isReferencedBy = (id: string): boolean => {
		const layer = compositionState.layers[id];
		if (!layer.parentLayerId) {
			return false;
		}
		if (layer.parentLayerId === layerId) {
			return true;
		}
		return isReferencedBy(layer.parentLayerId);
	};

	return layerIds.filter((layerId) => !isReferencedBy(layerId));
};
