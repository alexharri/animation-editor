import { Layer } from "~/composition/compositionTypes";
import { PropertyManager } from "~/composition/manager/property/propertyManager";
import { getPixiLayerGraphic, updatePixiLayerGraphic } from "~/render/pixi/layerToPixi";

interface Options {
	propertyManager: PropertyManager;
}

export class GraphicManager {
	private layerToGraphic: Record<string, PIXI.Graphics> = {};
	private propertyManager: PropertyManager;

	constructor(options: Options) {
		this.propertyManager = options.propertyManager;
	}

	public getLayerGraphic(actionState: ActionState, layer: Layer): PIXI.Graphics {
		if (!this.layerToGraphic[layer.id]) {
			this.layerToGraphic[layer.id] = getPixiLayerGraphic(
				actionState,
				layer,
				this.propertyManager.getPropertyValue,
			);
		}
		return this.layerToGraphic[layer.id];
	}

	public updateLayerGraphic(actionState: ActionState, layer: Layer) {
		const graphic = this.layerToGraphic[layer.id];
		if (!graphic) {
			throw new Error(`No graphic exists for '${layer.id}'.`);
		}
		updatePixiLayerGraphic(actionState, layer, graphic, this.propertyManager.getPropertyValue);
	}

	public deleteLayerGraphic(layerId: string) {
		const graphic = this.layerToGraphic[layerId];
		if (graphic) {
			graphic.destroy({ children: true });
			delete this.layerToGraphic[layerId];
		}
	}
}
