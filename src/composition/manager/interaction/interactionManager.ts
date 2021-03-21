import * as PIXI from "pixi.js";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { createAnchorGraphic } from "~/composition/interaction/anchorGuide";
import { createLayerSpecificInteractionGraphics } from "~/composition/interaction/drawInteractions";
import {
	clearLayerSpecificPreviewGraphics,
	drawLayerSpecificPreviewGraphics,
} from "~/composition/interaction/preview";
import {
	createCornersGuideGraphic,
	createRectGuideGraphic,
} from "~/composition/interaction/rectGuide";
import { shouldShowInteractions } from "~/composition/interaction/shouldShowInteraction";
import { createLayerViewportMatrices } from "~/composition/layer/constructLayerMatrix";
import { getLayerRect } from "~/composition/layer/layerDimensions";
import { constructLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { HitTestManager } from "~/composition/manager/hitTest/HitTestManager";
import { PropertyManager } from "~/composition/manager/property/propertyManager";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { getLayerChildLayers } from "~/shared/layer/layerParentSort";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { getMousePosition } from "~/util/mouse";

export interface InteractionManager {
	addLayer: (actionState: ActionState, layerId: string) => void;
	update: (actionState: ActionState, layerId: string) => void;
	mouseMove: (actionState: ActionState, mousePosition: Vec2) => void;
	mouseOut: (actionState: ActionState) => void;
	onToolChange: (actionState: ActionState) => void;
	removeLayer: (layerId: string) => void;
	layerMouseOver: (layerId: string) => void;
	layerMouseOut: (layerId: string) => void;
	onScaleChange: (actionState: ActionState, scale: number) => void;
	updateOwnAndChildLayerGuides: (actionState: ActionState, layerId: string) => void;
}

export const _emptyInteractionManager: InteractionManager = {
	addLayer: () => {},
	update: () => {},
	mouseMove: () => {},
	mouseOut: () => {},
	onToolChange: () => {},
	removeLayer: () => {},
	layerMouseOut: () => {},
	layerMouseOver: () => {},
	onScaleChange: () => {},
	updateOwnAndChildLayerGuides: () => {},
};

export const createInteractionManager = (
	compositionId: string,
	areaId: string,
	properties: PropertyManager,
	hitTestManager: HitTestManager,
	container: PIXI.Container,
	initialScale = 1,
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

	let scale = initialScale;

	const getMatrices = (actionState: ActionState, layerId: string) => {
		return createLayerViewportMatrices(
			actionState,
			properties.getPropertyValue,
			layerId,
			scale,
		);
	};

	const getRect = (actionState: ActionState, layerId: string) =>
		getLayerRect(
			actionState,
			actionState.compositionState.layers[layerId],
			constructLayerPropertyMap(layerId, actionState.compositionState),
			properties.getPropertyValue,
		);

	const updateLayer = (actionState: ActionState, layerId: string) => {
		const selection = getCompSelection(actionState);
		const layerSelected = !!selection.layers[layerId];
		isSelectedByLayer[layerId] = layerSelected;

		if (interactionContainersByLayer[layerId]) {
			for (const item of containersByLayer[layerId]) {
				item.parent.removeChild(item);
				item.destroy({ children: true });
			}

			delete containersByLayer[layerId];
			delete interactionContainersByLayer[layerId];
		}

		const graphics: PIXI.Container[] = [];
		const addGraphic = (graphic: PIXI.Container, zIndex: number) => {
			graphic.zIndex = zIndex;
			graphics.push(graphic);
		};

		const matrices = getMatrices(actionState, layerId);
		const rect = getRect(actionState, layerId);

		const anchorGraphic = createAnchorGraphic(matrices.position);
		const rectGraphic = createRectGuideGraphic(rect, matrices.content);
		const cornersGraphic = createCornersGuideGraphic(rect, matrices.content);
		const layerSpecificGraphic = createLayerSpecificInteractionGraphics(
			actionState,
			layerId,
			areaId,
			matrices,
		);
		const previewGraphic = new PIXI.Container();

		interactionContainersByLayer[layerId] = {
			anchor: anchorGraphic,
			rect: rectGraphic,
			rectCorners: cornersGraphic,
			layerSpecific: layerSpecificGraphic,
			preview: previewGraphic,
		};

		addGraphic(anchorGraphic, 1000);
		addGraphic(rectGraphic, 900);
		addGraphic(cornersGraphic, 900);
		addGraphic(layerSpecificGraphic, 500);
		addGraphic(previewGraphic, 450);

		containersByLayer[layerId] = graphics;

		if (graphics.length) {
			container.addChild(...graphics);
			container.sortableChildren = true;
		}

		updateLayerVisibility(actionState, layerId, false);
	};

	const self: InteractionManager = {
		addLayer: (actionState, layerId) => {
			const hitTestGraphic = hitTestManager.getGraphic(actionState, layerId);
			hitTestGraphic.alpha = 0;
			hitTestGraphic.interactive = true;
			hitTestGraphic.on("mouseover", () => {
				self.layerMouseOver(layerId);
			});
			hitTestGraphic.on("mouseout", () => {
				self.layerMouseOut(layerId);
			});

			updateLayer(actionState, layerId);
		},
		update: (actionState, layerId) => {
			updateLayer(actionState, layerId);
			updateLayerVisibility(actionState, layerId, false);
		},
		mouseMove: (actionState, mousePosition) => {
			const composition = actionState.compositionState.compositions[compositionId];

			const { pan } = getAreaActionState<AreaType.Workspace>(areaId);
			const viewport = getAreaViewport(areaId, AreaType.Workspace);

			for (const layerId of composition.layers) {
				const matrices = getMatrices(actionState, layerId);
				const n_mousePosition = mousePosition
					.subX(viewport.left)
					.subY(viewport.top)
					.subX(viewport.width / 2)
					.subY(viewport.height / 2)
					.sub(pan)
					.apply((vec) => matrices.content.applyInverse(vec));
				drawLayerSpecificPreviewGraphics(
					actionState,
					layerId,
					areaId,
					matrices,
					n_mousePosition,
					interactionContainersByLayer[layerId].preview,
				);
			}
		},
		onToolChange: (actionState) => {
			const mousePosition = getMousePosition();
			self.mouseMove(actionState, mousePosition);
		},
		mouseOut: (actionState) => {
			const composition = actionState.compositionState.compositions[compositionId];

			for (const layerId of composition.layers) {
				clearLayerSpecificPreviewGraphics(interactionContainersByLayer[layerId].preview);
			}
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
		onScaleChange: (actionState, nextScale) => {
			if (scale === nextScale) {
				return;
			}
			scale = nextScale;
			const { compositionState } = actionState;
			const composition = compositionState.compositions[compositionId];
			for (const layerId of composition.layers) {
				self.update(actionState, layerId);
			}
		},

		updateOwnAndChildLayerGuides: (actionState, layerId) => {
			const { compositionState } = actionState;
			self.update(actionState, layerId);

			const childLayers = getLayerChildLayers(layerId, compositionState);
			for (const layerId of childLayers) {
				self.update(actionState, layerId);
			}
		},
	};

	{
		const actionState = getActionState();
		const { compositionState } = actionState;
		const composition = compositionState.compositions[compositionId];
		for (const layerId of composition.layers) {
			self.addLayer(actionState, layerId);
		}
	}

	return self;
};
