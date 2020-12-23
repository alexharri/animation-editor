import * as PIXI from "pixi.js";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { Layer } from "~/composition/compositionTypes";
import { layerUtils } from "~/composition/layer/layerUtils";
import { AreaType, DEG_TO_RAD_FAC } from "~/constants";
import { Diff, DiffType } from "~/diff/diffs";
import { subscribeToDiffs, unsubscribeToDiffs } from "~/listener/diffListener";
import { layerToPixi, updatePixiLayerContent } from "~/render/pixi/layerToPixi";
import { getActionState, getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { LayerType } from "~/types";
import { Area } from "~/types/areaTypes";

type LayerContainerRegistry = ReturnType<typeof createLayerContainerRegistry>;

const createLayerContainerRegistry = (compContainer: PIXI.Container) => {
	const registry: Record<string, PIXI.Container> = {};
	const subCompositions: Record<
		string,
		{ manager: ReturnType<typeof manageCompositionLayer> }
	> = {};

	return {
		addLayer: (layer: Layer, container: PIXI.Container, actionState: ActionState) => {
			compContainer.addChild(container);
			registry[layer.id] = container;

			if (layer.type === LayerType.Composition) {
				const compositionId =
					actionState.compositionState.compositionLayerIdToComposition[layer.id];
				const manager = manageCompositionLayer(compositionId, container);
				subCompositions[layer.id] = { manager };
			}
		},
		getLayer: (layerId: string) => {
			return registry[layerId];
		},
		removeLayer: (layer: Layer) => {
			const container = registry[layer.id];
			container.parent.removeChild(container);
			container.destroy();
			delete registry[layer.id];

			if (layer.type === LayerType.Composition) {
				const { manager } = subCompositions[layer.id];
				manager.destroy();
			}
		},
		sendDiffs: (actionState: ActionState, diffs: Diff[], direction: "forward" | "backward") => {
			const keys = Object.keys(subCompositions);
			for (const key of keys) {
				const { manager } = subCompositions[key];
				manager.onDiffs(actionState, diffs, direction);
			}
		},
	};
};

const populateCompositionContainer = (
	state: ActionState,
	compositionId: string,
	compContainer: PIXI.Container,
	registry: LayerContainerRegistry,
) => {
	const composition = state.compositionState.compositions[compositionId];

	for (let i = 0; i < composition.layers.length; i++) {
		const layerId = composition.layers[i];
		const layer = state.compositionState.layers[layerId];
		const container = layerToPixi(state, layer);
		container.zIndex = composition.layers.length - i;
		compContainer.addChild(container);
		registry.addLayer(layer, container, state);
	}
};

const manageCompositionLayer = (compositionId: string, parentCompContainer: PIXI.Container) => {
	let prevState = getActionStateFromApplicationState(store.getState());

	const compContainer = new PIXI.Container();
	compContainer.sortableChildren = true;
	parentCompContainer.addChild(compContainer);
	const registry = createLayerContainerRegistry(compContainer);

	populateCompositionContainer(prevState, compositionId, compContainer, registry);

	const onDiffs = (
		actionState: ActionState,
		diffs: Diff[],
		direction: "forward" | "backward",
	) => {
		const composition = actionState.compositionState.compositions[compositionId];
		const compLayers = new Set(composition.layers);

		let shouldUpdateZIndices = false;

		const onAddLayers = (layerIds: string[]) => {
			shouldUpdateZIndices = true;
			for (const layerId of layerIds) {
				const layer = actionState.compositionState.layers[layerId];
				if (layer.compositionId !== compositionId) {
					continue;
				}

				const container = layerToPixi(actionState, layer);
				compContainer.addChild(container);
				registry.addLayer(layer, container, actionState);
			}
		};
		const onRemoveLayers = (layerIds: string[]) => {
			shouldUpdateZIndices = true;
			for (const layerId of layerIds) {
				const layer = prevState.compositionState.layers[layerId];
				if (layer.compositionId !== compositionId) {
					continue;
				}

				registry.removeLayer(layer);
			}
		};

		for (const diff of diffs) {
			if (direction === "backward") {
				switch (diff.type) {
					case DiffType.AddLayer: {
						onRemoveLayers(diff.layerIds);
						continue;
					}
					case DiffType.RemoveLayer: {
						onAddLayers(diff.layerIds);
						continue;
					}
				}
			}

			switch (diff.type) {
				case DiffType.MoveLayer: {
					const { layerIds } = diff;
					for (const layerId of layerIds) {
						if (!compLayers.has(layerId)) {
							continue;
						}

						const container = registry.getLayer(layerId);
						const position = layerUtils.getPosition(layerId);
						container.position.set(position.x, position.y);
					}
					break;
				}
				case DiffType.LayerTransform: {
					const { layerIds } = diff;
					for (const layerId of layerIds) {
						if (!compLayers.has(layerId)) {
							continue;
						}

						const container = registry.getLayer(layerId);
						const transform = layerUtils.getTransform(layerId);
						const { translate, anchor, scaleX, scaleY, rotation } = transform;
						container.position.set(translate.x, translate.y);
						container.scale.set(scaleX, scaleY);
						container.pivot.set(anchor.x, anchor.y);
						container.rotation = rotation * DEG_TO_RAD_FAC;
					}
					break;
				}
				case DiffType.AddLayer: {
					onAddLayers(diff.layerIds);
					break;
				}
				case DiffType.RemoveLayer: {
					onRemoveLayers(diff.layerIds);
					break;
				}
				case DiffType.Layer: {
					const { compositionState } = actionState;
					for (const layerId of diff.layerIds) {
						if (!compLayers.has(layerId)) {
							continue;
						}

						const layer = compositionState.layers[layerId];
						const container = registry.getLayer(layerId);
						updatePixiLayerContent(actionState, layer, container);
					}
					break;
				}
			}
		}

		registry.sendDiffs(actionState, diffs, direction);

		if (shouldUpdateZIndices) {
			for (let i = 0; i < composition.layers.length; i++) {
				const layerId = composition.layers[i];
				const container = registry.getLayer(layerId);
				container.zIndex = composition.layers.length - i;
			}
		}

		prevState = getActionStateFromApplicationState(store.getState());
	};

	return {
		destroy: () => {
			parentCompContainer.removeChild(compContainer);
			compContainer.destroy({ children: true, texture: true, baseTexture: true });
		},
		onDiffs,
	};
};

export const manageComposition = (
	compositionId: string,
	areaId: string,
	canvas: HTMLCanvasElement,
) => {
	// let lastHistoryIndex = store.getState().flowState.index;
	let prevState = getActionStateFromApplicationState(store.getState());

	// const unsubscribe = store.subscribe(() => {
	// 	const index = store.getState().flowState.index;
	// 	if (index === lastHistoryIndex) {
	// 		return;
	// 	}
	// 	lastHistoryIndex = index;
	// 	prevState = getActionStateFromApplicationState(store.getState());
	// 	console.log(index);
	// });

	const app = new PIXI.Application({
		width: canvas.width,
		height: canvas.height,
		view: canvas,
		transparent: true,
		antialias: true,
	});

	const getHalfStage = () => Vec2.new(canvas.width, canvas.height).scale(0.5);

	const compContainer = new PIXI.Container();

	const background = new PIXI.Graphics();
	compContainer.addChild(background);

	const compManager = manageCompositionLayer(compositionId, compContainer);

	{
		const composition = prevState.compositionState.compositions[compositionId];

		const area = prevState.area.areas[areaId] as Area<AreaType.Workspace>;
		const { scale = 1, pan: _pan = Vec2.ORIGIN } = area ? area.state : {};

		const pan = _pan.add(getHalfStage());

		compContainer.scale.set(scale, scale);
		compContainer.position.set(pan.x, pan.y);

		background.beginFill(0x555555);
		background.drawRect(0, 0, composition.width, composition.height);
	}

	app.stage.addChild(compContainer);

	const diffToken = subscribeToDiffs((diffs, direction) => {
		const actionState = getActionState();
		compManager.onDiffs(actionState, diffs, direction);

		for (const diff of diffs) {
			switch (diff.type) {
				case DiffType.ModifyCompositionView: {
					if (diff.compositionId !== compositionId) {
						// Another composition's pan or scale was modified.
						continue;
					}

					const area = actionState.area.areas[areaId] as Area<AreaType.Workspace>;
					const { scale } = area.state;
					const pan = area.state.pan.add(getHalfStage());
					compContainer.scale.set(scale, scale);
					compContainer.position.set(pan.x, pan.y);
					break;
				}
				case DiffType.ModifyCompositionDimensions: {
					if (diff.compositionId !== compositionId) {
						// Another composition's dimensions were modified.
						continue;
					}

					const { compositionState } = actionState;
					const { width, height } = compositionState.compositions[compositionId];
					background.clear();
					background.beginFill(0x555555);
					background.drawRect(0, 0, width, height);
					break;
				}
				case DiffType.ResizeAreas: {
					const areaViewport = getAreaViewport(areaId, AreaType.Workspace);
					app.renderer.resize(areaViewport.width, areaViewport.height);
					const area = actionState.area.areas[areaId] as Area<AreaType.Workspace>;
					const { pan: _pan = Vec2.ORIGIN } = area ? area.state : {};
					const pan = _pan.add(getHalfStage());
					compContainer.position.set(pan.x, pan.y);
				}
			}
		}

		prevState = getActionStateFromApplicationState(store.getState());
	});

	return () => {
		unsubscribeToDiffs(diffToken);
		compManager.destroy();
		app.destroy(false, { children: true, baseTexture: true, texture: true });
	};
};
