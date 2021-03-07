import * as PIXI from "pixi.js";
import { createAnchorGraphic } from "~/composition/interaction/anchorGuide";
import {
	createCornersGuideGraphic,
	createRectGuideGraphic,
} from "~/composition/interaction/rectGuide";
import { LayerMatrices } from "~/composition/layer/constructLayerMatrix";
import { shapeLayerInteractions } from "~/composition/layer/shapeLayerInteraction";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";

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
	layerMouseOver: (layerId: string) => void;
	layerMouseDown: (layerId: string) => void;
	layerMouseOut: (layerId: string) => void;
}

export const _emptyInteractionManager: InteractionManager = {
	addLayer: () => {},
	update: () => {},
	layerMouseDown: () => {},
	layerMouseOut: () => {},
	layerMouseOver: () => {},
};

export const createInteractionManager = (
	compositionId: string,
	areaId: string,
	container: PIXI.Container,
): InteractionManager => {
	const containersByLayer: Record<string, PIXI.Container[]> = {};
	const xByLayer: Record<
		string,
		{
			rect: PIXI.Container;
			anchor: PIXI.Container;
			corners: PIXI.Container;
		}
	> = {};
	const isSelectedByLayer: Record<string, boolean> = {};

	const getCompSelection = (actionState: ActionState) => {
		const { compositionSelectionState } = actionState;
		const selection = compSelectionFromState(compositionId, compositionSelectionState);
		return selection;
	};

	const self: InteractionManager = {
		addLayer: (actionState, layerId, matrices, rect) => {
			const graphics: PIXI.Container[] = [];

			const addGraphic = (graphic: PIXI.Container, zIndex: number) => {
				graphic.zIndex = zIndex;
				graphics.push(graphic);
			};

			const selection = getCompSelection(actionState);

			const layerSelected = !!selection.layers[layerId];

			isSelectedByLayer[layerId] = layerSelected;

			const anchorGraphic = createAnchorGraphic(matrices.position);
			const rectGraphic = createRectGuideGraphic(rect, matrices.content);
			const cornersGraphic = createCornersGuideGraphic(rect, matrices.content);

			anchorGraphic.alpha = layerSelected ? 1 : 0;
			rectGraphic.alpha = layerSelected ? 1 : 0;
			cornersGraphic.alpha = layerSelected ? 1 : 0;

			xByLayer[layerId] = {
				anchor: anchorGraphic,
				rect: rectGraphic,
				corners: cornersGraphic,
			};

			addGraphic(anchorGraphic, 1000);
			addGraphic(rectGraphic, 900);
			addGraphic(cornersGraphic, 900);

			const layer = actionState.compositionState.layers[layerId];
			shapeLayerInteractions(actionState, areaId, addGraphic, layer, (vec2) =>
				Vec2.new(matrices.content.apply(vec2)),
			);

			containersByLayer[layerId] = graphics;

			if (graphics.length) {
				container.addChild(...graphics);
				container.sortableChildren = true;
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
		layerMouseOver: (layerId) => {
			if (isSelectedByLayer[layerId]) {
				return;
			}

			xByLayer[layerId].rect.alpha = 1;
		},
		layerMouseOut: (layerId) => {
			if (isSelectedByLayer[layerId]) {
				return;
			}

			xByLayer[layerId].rect.alpha = 0;
		},
		layerMouseDown: (layerId) => {
			console.log("Mousedown");
		},
	};

	return self;
};
