import * as PIXI from "pixi.js";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { CompositionContext } from "~/composition/manager/compositionContext";
import { compositionDiffHandler } from "~/composition/manager/compositionDiffHandler";
import { createLayerManager } from "~/composition/manager/layerManager";
import { createPropertyManager } from "~/composition/manager/propertyManager";
import { AreaType } from "~/constants";
import { DiffType } from "~/diff/diffs";
import { subscribeToDiffs, unsubscribeToDiffs } from "~/listener/diffListener";
import { getActionState, getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { Area } from "~/types/areaTypes";

export const manageComposition = (
	compositionId: string,
	parentCompContainer: PIXI.Container,
): CompositionContext => {
	const container = new PIXI.Container();
	container.sortableChildren = true;

	const propertyManager = createPropertyManager(compositionId, getActionState());
	const layerManager = createLayerManager(
		compositionId,
		container,
		propertyManager,
		getActionState(),
	);

	const ctx: CompositionContext = {
		compositionId,
		container,
		layers: layerManager,
		properties: propertyManager,
		onDiffs: (actionState, diffs, direction) =>
			compositionDiffHandler(ctx, actionState, diffs, direction),
		prevState: getActionState(),
		destroy: () => {
			parentCompContainer.removeChild(ctx.container);
			ctx.container.destroy({ children: true, texture: true, baseTexture: true });
		},
	};
	parentCompContainer.addChild(ctx.container);

	return ctx;
};

export const manageTopLevelComposition = (
	compositionId: string,
	areaId: string,
	canvas: HTMLCanvasElement,
) => {
	let prevState = getActionStateFromApplicationState(store.getState());

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

	const ctx = manageComposition(compositionId, compContainer);

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
		ctx.onDiffs(actionState, diffs, direction);

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
		ctx.destroy();
		app.destroy(false, { children: true, baseTexture: true, texture: true });
	};
};
