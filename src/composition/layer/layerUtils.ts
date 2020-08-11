import { CompositionState } from "~/composition/state/compositionReducer";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { CompositionRenderValues, LayerType, PropertyName } from "~/types";

const layerTypeToName: { [key in keyof typeof LayerType]: string } = {
	Ellipse: "Ellipse layer",
	Rect: "Rect layer",
	Composition: "Composition layer",
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

	const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
		(obj, p) => {
			const value = map.properties[p.id];
			(obj as any)[PropertyName[p.name]] = value.computedValue;
			return obj;
		},
		{} as any,
	);

	return nameToProperty;
};
