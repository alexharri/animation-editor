import { CompositionState } from "~/composition/compositionReducer";
import { forEachLayerProperty } from "~/composition/compositionUtils";
import { LayerType, PropertyGroupName, PropertyName } from "~/types";

export interface CommonLayerPropertyMap {
	[PropertyName.PositionX]: string;
	[PropertyName.PositionY]: string;
	[PropertyName.Rotation]: string;
	[PropertyName.AnchorX]: string;
	[PropertyName.AnchorY]: string;
	[PropertyName.ScaleX]: string;
	[PropertyName.ScaleY]: string;
}

export interface RectLayerPropertyMap extends CommonLayerPropertyMap {
	[PropertyName.Width]: string;
	[PropertyName.Height]: string;
	[PropertyName.Fill]: string;
	[PropertyName.StrokeWidth]: string;
	[PropertyName.StrokeColor]: string;
	[PropertyName.BorderRadius]: string;
}

export interface EllipseLayerPropertyMap extends CommonLayerPropertyMap {
	[PropertyName.OuterRadius]: string;
	[PropertyName.InnerRadius]: string;
	[PropertyName.Fill]: string;
	[PropertyName.StrokeWidth]: string;
	[PropertyName.StrokeColor]: string;
}

export interface ShapeLayerPropertyMap extends CommonLayerPropertyMap {}

export interface LineLayerPropertyMap extends CommonLayerPropertyMap {
	[PropertyName.Width]: string;
	[PropertyName.StrokeWidth]: string;
	[PropertyName.StrokeColor]: string;
	[PropertyName.LineCap]: string;
}

export interface CompositionLayerPropertyMap extends CommonLayerPropertyMap {
	[PropertyName.Width]: string;
	[PropertyName.Height]: string;
}

export type LayerPropertyMap =
	| RectLayerPropertyMap
	| EllipseLayerPropertyMap
	| ShapeLayerPropertyMap
	| LineLayerPropertyMap
	| CompositionLayerPropertyMap;

const _initialCommonMap: CommonLayerPropertyMap = {
	[PropertyName.PositionX]: "",
	[PropertyName.PositionY]: "",
	[PropertyName.Rotation]: "",
	[PropertyName.AnchorX]: "",
	[PropertyName.AnchorY]: "",
	[PropertyName.ScaleX]: "",
	[PropertyName.ScaleY]: "",
};

const ignoreGroups = {
	// Ignore shape layer's Content group so that the shape transform
	// does not override the transform properties.
	[LayerType.Shape]: [PropertyGroupName.Content],

	[LayerType.Composition]: [],
	[LayerType.Ellipse]: [],
	[LayerType.Line]: [],
	[LayerType.Rect]: [],
};

const populateMap = (layerId: string, compositionState: CompositionState, map: any) => {
	const layer = compositionState.layers[layerId];

	forEachLayerProperty(
		layerId,
		compositionState,
		(property) => {
			if (map.hasOwnProperty(property.name)) {
				(map as any)[property.name] = property.id;
			}
		},
		{ ignoreGroups: [ignoreGroups[layer.type], PropertyGroupName.ArrayModifier] },
	);
};

function rectLayerPropertyMap(layerId: string, compositionState: CompositionState) {
	const map: RectLayerPropertyMap = {
		..._initialCommonMap,
		[PropertyName.Width]: "",
		[PropertyName.Height]: "",
		[PropertyName.Fill]: "",
		[PropertyName.StrokeWidth]: "",
		[PropertyName.StrokeColor]: "",
		[PropertyName.BorderRadius]: "",
	};
	populateMap(layerId, compositionState, map);
	return map;
}

function ellipseLayerPropertyMap(layerId: string, compositionState: CompositionState) {
	const map: EllipseLayerPropertyMap = {
		..._initialCommonMap,
		[PropertyName.OuterRadius]: "",
		[PropertyName.InnerRadius]: "",
		[PropertyName.Fill]: "",
		[PropertyName.StrokeWidth]: "",
		[PropertyName.StrokeColor]: "",
	};
	populateMap(layerId, compositionState, map);
	return map;
}

function shapeLayerPropertyMap(layerId: string, compositionState: CompositionState) {
	const map: ShapeLayerPropertyMap = {
		..._initialCommonMap,
	};
	populateMap(layerId, compositionState, map);
	return map;
}

function lineLayerPropertyMap(layerId: string, compositionState: CompositionState) {
	const map: LineLayerPropertyMap = {
		..._initialCommonMap,
		[PropertyName.Width]: "",
		[PropertyName.StrokeWidth]: "",
		[PropertyName.StrokeColor]: "",
		[PropertyName.LineCap]: "",
	};
	populateMap(layerId, compositionState, map);
	return map;
}

function compositionLayerPropertyMap(layerId: string, compositionState: CompositionState) {
	const map: CompositionLayerPropertyMap = {
		..._initialCommonMap,
		[PropertyName.Width]: "",
		[PropertyName.Height]: "",
	};
	populateMap(layerId, compositionState, map);
	return map;
}

export const constructLayerPropertyMap = (
	layerId: string,
	compositionState: CompositionState,
): LayerPropertyMap => {
	const layer = compositionState.layers[layerId];
	switch (layer.type) {
		case LayerType.Rect:
			return rectLayerPropertyMap(layerId, compositionState);
		case LayerType.Ellipse:
			return ellipseLayerPropertyMap(layerId, compositionState);
		case LayerType.Shape:
			return shapeLayerPropertyMap(layerId, compositionState);
		case LayerType.Line:
			return lineLayerPropertyMap(layerId, compositionState);
		case LayerType.Composition:
			return compositionLayerPropertyMap(layerId, compositionState);
		default:
			throw new Error(`Cannot construct layer property map for layer type '${layer.type}'.`);
	}
};
