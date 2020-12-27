import { layerUtils } from "~/composition/layer/layerUtils";
import { CompositionContext } from "~/composition/manager/compositionContext";
import { executePerformables } from "~/composition/manager/executePerformables";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";
import { Diff, DiffType } from "~/diff/diffs";
import { getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";

export const compositionDiffHandler = (
	ctx: CompositionContext,
	actionState: ActionState,
	diffs: Diff[],
	direction: "forward" | "backward",
) => {
	const { compositionId } = ctx;

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

			ctx.layers.addLayer(layer, actionState);
		}
	};
	const onRemoveLayers = (layerIds: string[]) => {
		shouldUpdateZIndices = true;
		for (const layerId of layerIds) {
			const layer = ctx.prevState.compositionState.layers[layerId];
			if (layer.compositionId !== compositionId) {
				continue;
			}

			ctx.layers.removeLayer(layer);
		}
	};
	const onUpdateFrameIndex = () => {};

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

					const container = ctx.layers.getLayerContainer(layerId);
					const position = layerUtils.getPosition(layerId);
					container.position.set(position.x, position.y);
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
			case DiffType.FrameIndex: {
				if (compositionId !== diff.compositionId) {
					break;
				}

				const actions = ctx.layers.getActionsToPerformOnFrameIndexChange();

				for (const { layerId, performables } of actions) {
					executePerformables(ctx, actionState, layerId, performables);
				}
				break;
			}
			case DiffType.ModifyProperty: {
				const { propertyId } = diff;
				const { compositionState } = actionState;
				const property = compositionState.properties[propertyId];
				const performable = ctx.layers.getActionToPerform(propertyId);
				executePerformables(ctx, actionState, property.layerId, [performable]);
				break;
			}
			case DiffType.TogglePropertyAnimated: {
				const { propertyId } = diff;
				const { compositionState } = actionState;
				const property = compositionState.properties[propertyId];
				const layer = compositionState.layers[property.layerId];
				ctx.layers.updatePropertyStructure(layer, actionState);
				break;
			}
			case DiffType.ModifyMultipleLayerProperties: {
				const { modified } = diff;
				for (const { layerId, propertyIds } of modified) {
					const performables = ctx.layers.getActionsToPerform(propertyIds);
					executePerformables(ctx, actionState, layerId, performables);
				}
				break;
			}
		}
	}

	ctx.layers.sendDiffs(actionState, diffs, direction);

	if (shouldUpdateZIndices) {
		updateLayerZIndices(composition, ctx.layers);
	}

	ctx.prevState = getActionStateFromApplicationState(store.getState());
};
