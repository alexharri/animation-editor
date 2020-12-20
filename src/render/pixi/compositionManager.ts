import * as PIXI from "pixi.js";
import { layerUtils } from "~/composition/layer/layerUtils";
import { AreaType } from "~/constants";
import { DiffType } from "~/diff/diffs";
import { subscribeToDiffs, unsubscribeToDiffs } from "~/listener/diffListener";
import { layerToPixi, updatePixiLayerContent } from "~/render/pixi/layerToPixi";
import { getActionState, getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { Area } from "~/types/areaTypes";

interface DiffOptions<T> {
	getter: (state: ActionState) => T;
	compare: (a: T, b: T) => boolean; // True if changed, false if same
	update: (data: T) => void;
}

export const manageComposition = (
	compositionId: string,
	areaId: string,
	canvas: HTMLCanvasElement,
) => {
	console.log("creating comp");
	let prevState = getActionStateFromApplicationState(store.getState());

	const app = new PIXI.Application({
		width: canvas.width,
		height: canvas.height,
		view: canvas,
		transparent: true,
		antialias: true,
	});

	const graphics: Record<string, PIXI.Graphics> = {};

	const getHalfStage = () => Vec2.new(canvas.width, canvas.height).scale(0.5);

	const compContainer = new PIXI.Container();

	const background = new PIXI.Graphics();
	compContainer.addChild(background);

	{
		const composition = prevState.compositionState.compositions[compositionId];

		for (const layerId of composition.layers) {
			const layer = prevState.compositionState.layers[layerId];
			const graphic = layerToPixi(prevState, layer);
			compContainer.addChild(graphic);
			graphics[layer.id] = graphic;
		}

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

		const onAddLayers = (layerIds: string[]) => {
			for (const layerId of layerIds) {
				const layer = actionState.compositionState.layers[layerId];
				const graphic = layerToPixi(actionState, layer);
				compContainer.addChild(graphic);
				graphics[layer.id] = graphic;
			}
		};
		const onRemoveLayers = (layerIds: string[]) => {
			for (const layerId of layerIds) {
				const graphic = graphics[layerId];
				delete graphics[layerId];
				graphic.parent.removeChild(graphic);
				graphic.destroy();
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
						const graphic = graphics[layerId];

						const position = layerUtils.getPosition(layerId);
						graphic.position.set(position.x, position.y);
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
						const layer = compositionState.layers[layerId];
						const graphic = graphics[layerId];
						if (!graphic) {
							continue;
						}
						updatePixiLayerContent(actionState, layer, graphic);
					}
				}
			}
		}
	});

	store.subscribe(() => {
		const currState = getActionStateFromApplicationState(store.getState());

		const diff = <T>(options: DiffOptions<T>) => {
			const a = options.getter(currState);
			const b = options.getter(prevState);
			if (!options.compare(a, b)) {
				return;
			}
			options.update(a);
		};

		diff<Area<AreaType.Workspace>>({
			getter: (state) => state.area.areas[areaId] as Area<AreaType.Workspace>,
			compare: (a, b) => {
				return a.state.pan !== b.state.pan || a.state.scale !== b.state.scale;
			},
			update: (area) => {
				const { scale } = area.state;
				const pan = area.state.pan.add(getHalfStage());
				compContainer.scale.set(scale, scale);
				compContainer.position.set(pan.x, pan.y);
			},
		});

		diff<Composition>({
			getter: (state) => state.compositionState.compositions[compositionId],
			compare: (a, b) => a !== b,
			update: (composition) => {
				background.clear();
				background.beginFill(0x555555);
				background.drawRect(0, 0, composition.width, composition.height);
			},
		});
	});

	return () => {
		unsubscribeToDiffs(diffToken);
		app.destroy(false, { children: true, baseTexture: true, texture: true });
	};
};
