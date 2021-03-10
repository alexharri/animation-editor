import * as PIXI from "pixi.js";
import { createAnchorGraphic } from "~/composition/interaction/anchorGuide";
import { createLayerSpecificInteractionGraphics } from "~/composition/interaction/drawInteractions";
import {
	createCornersGuideGraphic,
	createRectGuideGraphic,
} from "~/composition/interaction/rectGuide";
import { shouldShowInteractions } from "~/composition/interaction/shouldShowInteraction";
import { LayerMatrices } from "~/composition/layer/constructLayerMatrix";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { getActionState } from "~/state/stateUtils";

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
	removeLayer: (layerId: string) => void;
	layerMouseOver: (layerId: string) => void;
	layerMouseDown: (layerId: string) => void;
	layerMouseOut: (layerId: string) => void;
}

export const _emptyInteractionManager: InteractionManager = {
	addLayer: () => {},
	update: () => {},
	removeLayer: () => {},
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
	const interactionContainersByLayer: Record<string, InteractionContainers> = {};
	const isSelectedByLayer: Record<string, boolean> = {};

	const getCompSelection = (actionState: ActionState) => {
		const { compositionSelectionState } = actionState;
		const selection = compSelectionFromState(compositionId, compositionSelectionState);
		return selection;
	};

	const updateLayerVisibility = (
		actionState: ActionState,
		layerId: string,
		isLayerHovered: boolean,
	) => {
		const showInteractions = shouldShowInteractions(actionState, layerId, isLayerHovered);
		const keys = Object.keys(showInteractions) as Array<keyof typeof showInteractions>;
		for (const key of keys) {
			interactionContainersByLayer[layerId][key].visible = showInteractions[key];
		}
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
			const layerSpecificGraphic = createLayerSpecificInteractionGraphics(
				actionState,
				layerId,
				areaId,
				matrices,
			);

			interactionContainersByLayer[layerId] = {
				anchor: anchorGraphic,
				rect: rectGraphic,
				rectCorners: cornersGraphic,
				layerSpecific: layerSpecificGraphic,
			};

			addGraphic(anchorGraphic, 1000);
			addGraphic(rectGraphic, 900);
			addGraphic(cornersGraphic, 900);
			addGraphic(layerSpecificGraphic, 500);

			containersByLayer[layerId] = graphics;

			if (graphics.length) {
				container.addChild(...graphics);
				container.sortableChildren = true;
			}

			updateLayerVisibility(actionState, layerId, false);
		},
		update: (actionState, layerId, matrices, rect) => {
			self.removeLayer(layerId);
			containersByLayer[layerId] = [];
			self.addLayer(actionState, layerId, matrices, rect);
			updateLayerVisibility(actionState, layerId, false);
		},
		removeLayer: (layerId) => {
			for (const item of containersByLayer[layerId]) {
				item.parent.removeChild(item);
				item.destroy({ children: true });
			}

			delete containersByLayer[layerId];
			delete interactionContainersByLayer[layerId];
			delete isSelectedByLayer[layerId];
		},
		layerMouseOver: (layerId) => {
			if (isSelectedByLayer[layerId]) {
				return;
			}

			updateLayerVisibility(getActionState(), layerId, true);
		},
		layerMouseOut: (layerId) => {
			if (isSelectedByLayer[layerId]) {
				return;
			}

			updateLayerVisibility(getActionState(), layerId, false);
		},
		layerMouseDown: (_layerId) => {
			console.log("Mousedown");
		},
	};

	return self;
};
