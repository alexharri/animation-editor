import { LayerType } from "~/types";

const layerTypeToName: { [key in keyof typeof LayerType]: string } = {
	Ellipse: "Ellipse layer",
	Rect: "Rect layer",
	Composition: "Composition layer",
};

export const getLayerTypeName = (type: LayerType): string => {
	const key = LayerType[type] as keyof typeof LayerType;
	return layerTypeToName[key];
};
