import * as PIXI from "pixi.js";
import { drawHitTestGraphic } from "~/composition/layer/layerInstances";
import { PropertyManager } from "~/composition/manager/property/propertyManager";

interface Options {
	compositionId: string;
	propertyManager: PropertyManager;
	depth: number;
}

export class HitTestManager {
	private graphicByLayer: Record<string, PIXI.Graphics> = {};
	private getPropertyValue: (propertyId: string) => any;
	private depth: number;

	constructor(options: Options) {
		this.getPropertyValue = options.propertyManager.getPropertyValue;
		this.depth = options.depth;
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
		if (this.depth !== 0) {
			return;
		}

		drawHitTestGraphic(
			actionState,
			layerId,
			this.graphicByLayer[layerId],
			this.getPropertyValue,
		);
	}
}
