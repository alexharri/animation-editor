import * as PIXI from "pixi.js";
import { drawHitTestGraphic } from "~/composition/layer/layerInstances";
import { PropertyManager } from "~/composition/manager/property/propertyManager";

interface Options {
	compositionId: string;
	propertyManager: PropertyManager;
}

export class HitTestManager {
	private graphicByLayer: Record<string, PIXI.Graphics> = {};
	private getPropertyValue: (propertyId: string) => any;

	constructor(options: Options) {
		this.getPropertyValue = options.propertyManager.getPropertyValue;
	}

	public getGraphic(actionState: ActionState, layerId: string): PIXI.Graphics {
		if (this.graphicByLayer[layerId]) {
			return this.graphicByLayer[layerId];
		}

		const graphic = new PIXI.Graphics();
		this.graphicByLayer[layerId] = graphic;
		this.draw(actionState, layerId);
		return graphic;
	}

	public deleteGraphic(layerId: string) {
		delete this.graphicByLayer[layerId];
	}

	public update(actionState: ActionState, layerId: string) {
		if (!this.graphicByLayer[layerId]) {
			this.getGraphic(actionState, layerId);
		}
		this.draw(actionState, layerId);
	}

	private draw(actionState: ActionState, layerId: string) {
		drawHitTestGraphic(
			actionState,
			layerId,
			this.graphicByLayer[layerId],
			this.getPropertyValue,
		);
	}
}
