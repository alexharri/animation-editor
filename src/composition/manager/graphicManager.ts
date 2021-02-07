import { Layer } from "~/composition/compositionTypes";
import { PropertyManager } from "~/composition/manager/propertyManager";
import { getPixiLayerGraphic, updatePixiLayerGraphic } from "~/render/pixi/layerToPixi";

export interface GraphicManager {
	getLayerGraphic: (actionState: ActionState, layer: Layer) => PIXI.Graphics;
	updateLayerGraphic: (actionState: ActionState, layer: Layer) => void;
	deleteLayerGraphic: (layerId: string) => void;
	onArrayModifierChange: (actionState: ActionState, layer: Layer) => void;
}

export const createGraphicManager = (
	_compositionId: string,
	properties: PropertyManager,
): GraphicManager => {
	const layerToGraphic: Record<string, PIXI.Graphics> = {};

	const self: GraphicManager = {
		getLayerGraphic: (actionState, layer) => {
			if (!layerToGraphic[layer.id]) {
				layerToGraphic[layer.id] = getPixiLayerGraphic(
					actionState,
					layer,
					properties.getPropertyValue,
				);
			}
			return layerToGraphic[layer.id];
		},
		updateLayerGraphic: (actionState, layer) => {
			const graphic = layerToGraphic[layer.id];
			if (!graphic) {
				throw new Error(`No graphic exists for '${layer.id}'.`);
			}
			updatePixiLayerGraphic(actionState, layer, graphic, properties.getPropertyValue);
		},
		deleteLayerGraphic: (layerId: string) => {
			const graphic = layerToGraphic[layerId];
			if (graphic) {
				graphic.destroy({ children: true });
				delete layerToGraphic[layerId];
			}
		},
		onArrayModifierChange: () => {},
	};

	return self;
};
