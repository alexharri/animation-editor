import * as PIXI from "pixi.js";
import { createAnchorGraphic } from "~/composition/interaction/anchorGuide";
import {
	createCornersGuideGraphic,
	createRectGuideGraphic,
} from "~/composition/interaction/rectGuide";
import { LayerMatrices } from "~/composition/layer/constructLayerMatrix";
import { shapeLayerInteractions } from "~/composition/layer/shapeLayerInteraction";

export interface InteractionManager {
	addLayer: (
		actionState: ActionState,
		layerId: string,
		matrices: LayerMatrices,
		rect: Rect,
	) => void;
	update: (
		actionState: ActionState,
		layerId: string,
		matrices: LayerMatrices,
		rect: Rect,
	) => void;
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
		addLayer: (actionState, layerId, matrices, rect) => {
			const graphics: PIXI.Container[] = [];

			const addGraphic = (graphic: PIXI.Container) => {
				graphics.push(graphic);
			};

			addGraphic(createAnchorGraphic(matrices.position));
			addGraphic(createRectGuideGraphic(rect, matrices.content));
			addGraphic(createCornersGuideGraphic(rect, matrices.content));

			const layer = actionState.compositionState.layers[layerId];
			shapeLayerInteractions(actionState, areaId, addGraphic, layer, (vec2) =>
				Vec2.new(matrices.content.apply(vec2)),
			);

			containersByLayer[layerId] = graphics;

			if (graphics.length) {
				container.addChild(...graphics);
			}
		},
		update: (actionState, layerId, matrices, rect) => {
			const items = containersByLayer[layerId];
			for (const item of items) {
				item.parent.removeChild(item);
				item.destroy({ children: true });
			}
			containersByLayer[layerId] = [];
			self.addLayer(actionState, layerId, matrices, rect);
		},
	};

	return self;
};
