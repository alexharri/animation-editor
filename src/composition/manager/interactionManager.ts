import * as PIXI from "pixi.js";
import { shapeLayerInteractions } from "~/composition/layer/shapeLayerInteraction";

export interface InteractionManager {
	addLayer: (actionState: ActionState, layerId: string, transform: PIXI.Matrix) => void;
	update: (actionState: ActionState, layerId: string, transform: PIXI.Matrix) => void;
}

export const _emptyInteractionManager: InteractionManager = {
	addLayer: () => {},
	update: () => {},
};

export const createInteractionManager = (
	_compositionId: string,
	areaId: string,
	container: PIXI.Container,
): InteractionManager => {
	const containersByLayer: Record<string, PIXI.Container[]> = {};

	const self: InteractionManager = {
		addLayer: (actionState, layerId, transform) => {
			const graphics: PIXI.Container[] = [];

			const addGraphic = (graphic: PIXI.Container) => {
				graphics.push(graphic);
			};

			const layer = actionState.compositionState.layers[layerId];
			shapeLayerInteractions(actionState, areaId, addGraphic, layer, (vec2) =>
				Vec2.new(transform.apply(vec2)),
			);

			containersByLayer[layerId] = graphics;

			if (graphics.length) {
				container.addChild(...graphics);
			}
		},
		update: (actionState, layerId, transform) => {
			const items = containersByLayer[layerId];
			for (const item of items) {
				item.parent.removeChild(item);
				item.destroy({ children: true });
			}
			containersByLayer[layerId] = [];
			self.addLayer(actionState, layerId, transform);
		},
	};

	return self;
};
