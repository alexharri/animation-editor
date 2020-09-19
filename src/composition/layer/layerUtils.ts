import { CompositionState } from "~/composition/compositionReducer";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { TIMELINE_HEADER_HEIGHT, TIMELINE_LAYER_HEIGHT } from "~/constants";
import { getTimelineTrackYPositions } from "~/trackEditor/trackEditorUtils";
import { CompositionRenderValues, LayerType, NameToProperty, PropertyName } from "~/types";
import { isVecInRect } from "~/util/math";

const layerTypeToName: { [key in keyof typeof LayerType]: string } = {
	Ellipse: "Ellipse layer",
	Rect: "Rect layer",
	Composition: "Composition layer",
	Shape: "Shape layer",
};

export const getLayerTypeName = (type: LayerType): string => {
	const key = LayerType[type] as keyof typeof LayerType;
	return layerTypeToName[key];
};

export const getLayerDimensions = (
	layerType: LayerType,
	nameToProperty: { [key in keyof typeof PropertyName]: any },
) => {
	let width: number;
	let height: number;

	switch (layerType) {
		case LayerType.Composition: {
			width = nameToProperty.Width;
			height = nameToProperty.Height;
			break;
		}

		/**
		 * @todo calculate shape layer bounding box
		 */
		case LayerType.Shape: {
			width = 100;
			height = 100;
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
	}

	return [width, height];
};

export const getLayerNameToProperty = (
	map: CompositionRenderValues,
	compositionState: CompositionState,
	layerId: string,
) => {
	const properties = getLayerCompositionProperties(layerId, compositionState);

	const nameToProperty = properties.reduce<NameToProperty>((obj, p) => {
		const value = map.properties[p.id];
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
