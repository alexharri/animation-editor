import { CompositionManager } from "~/composition/manager/compositionManager";
import { executePerformables } from "~/composition/manager/executePerformables";
import { propertyManagerDiffHandler } from "~/composition/manager/property/propertyManagerDiffHandler";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";
import {
	AddFlowNodeDiff,
	AddLayerDiff,
	CompositionSelectionDiff,
	Diff,
	DiffType,
	FlowNodeExpressionDiff,
	FlowNodeStateDiff,
	FrameIndexDiff,
	LayerDiff,
	LayerParentDiff,
	ModifyCompositionViewDiff,
	ModifyMultipleLayerPropertiesDiff,
	ModifyPropertyDiff,
	PropertyStructureDiff,
	RemoveFlowNodeDiff,
	RemoveLayerDiff,
	TogglePropertyAnimatedDiff,
	UpdateNodeConnectionDiff,
} from "~/diff/diffs";
import { getFlowNodeAssociatedCompositionId } from "~/flow/flowUtils";
import { getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { Performable } from "~/types";

export const compositionDiffHandler = (
	ctx: CompositionManager,
	actionState: ActionState,
	diffs: Diff[],
	direction: "forward" | "backward",
) => {
	const { compositionId } = ctx;

	const composition = actionState.compositionState.compositions[compositionId];

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

			ctx.layers.removeLayer(layer, actionState);
		}
	};

	const nodeDoesNotAffectComposition = (nodeId: string) => {
		return compositionId !== getFlowNodeAssociatedCompositionId(nodeId, actionState);
	};
	const propertyDoesNotAffectComposition = (propertyId: string) => {
		const property = actionState.compositionState.properties[propertyId];
		return compositionId !== property.compositionId;
	};
	const layerDoesNotAffectComposition = (layerId: string) => {
		const layer = actionState.compositionState.layers[layerId];
		return compositionId !== layer.compositionId;
	};

	interface PerformChangeOptions {
		nodeIds?: string[];
		propertyIds?: string[];
		layerIds?: string[];
	}

	const performChange = (options: PerformChangeOptions) => {
		const actions = ctx.properties.getActionsToPerform(actionState, options);
		for (const { layerId, performables } of actions) {
			executePerformables(ctx, actionState, layerId, performables);
		}
	};

	const backwardHandlers: { [diffType: number]: (diff: any) => void } = {
		[DiffType.AddLayer]: (diff: AddLayerDiff) => {
			onRemoveLayers(diff.layerIds);
		},
		[DiffType.RemoveLayer]: (diff: RemoveLayerDiff) => {
			onAddLayers(diff.layerIds);
		},
		[DiffType.RemoveFlowNode]: (diff: RemoveFlowNodeDiff) => {
			const { nodeId } = diff;

			if (nodeDoesNotAffectComposition(nodeId)) {
				return;
			}

			performChange({ nodeIds: [nodeId] });
		},
	};

	const forwardHandlers: { [diffType: number]: (diff: any) => void } = {
		[DiffType.AddLayer]: (diff: AddLayerDiff) => {
			onAddLayers(diff.layerIds);
		},
		[DiffType.RemoveLayer]: (diff: RemoveLayerDiff) => {
			onRemoveLayers(diff.layerIds);
		},
		[DiffType.FrameIndex]: (diff: FrameIndexDiff) => {
			if (compositionId !== diff.compositionId) {
				return;
			}

			ctx.layers.onFrameIndexChanged(actionState, diff.frameIndex);

			const actions = ctx.properties.getActionsToPerformOnFrameIndexChange();
			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
		},
		[DiffType.FlowNodeState]: (diff: FlowNodeStateDiff) => {
			const { nodeId } = diff;
			if (nodeDoesNotAffectComposition(nodeId)) {
				return;
			}
			performChange({ nodeIds: [nodeId] });
		},
		[DiffType.FlowNodeExpression]: (diff: FlowNodeExpressionDiff) => {
			const { nodeId } = diff;
			if (nodeDoesNotAffectComposition(nodeId)) {
				return;
			}

			performChange({ nodeIds: [nodeId] });
		},
		[DiffType.AddFlowNode]: (_diff: AddFlowNodeDiff) => {
			// See comment in propertyManagerDiffHandler
		},
		[DiffType.RemoveFlowNode]: (diff: RemoveFlowNodeDiff) => {
			const { nodeId } = diff;
			const { flowState } = ctx.prevState;
			const { graphId } = flowState.nodes[nodeId];
			const { layerId } = flowState.graphs[graphId];

			if (layerDoesNotAffectComposition(layerId)) {
				return;
			}

			performChange({ nodeIds: [nodeId] });
		},
		[DiffType.UpdateNodeConnection]: (diff: UpdateNodeConnectionDiff) => {
			const { nodeIds } = diff;

			if (nodeDoesNotAffectComposition(nodeIds[0])) {
				return;
			}

			performChange({ nodeIds });
		},
		[DiffType.Layer]: (diff: LayerDiff) => {
			const { layerIds } = diff;
			if (layerDoesNotAffectComposition(layerIds[0])) {
				return;
			}

			performChange({ layerIds });
		},
		[DiffType.ModifyProperty]: (diff: ModifyPropertyDiff) => {
			const { propertyId } = diff;

			if (propertyDoesNotAffectComposition(propertyId)) {
				return;
			}

			performChange({ propertyIds: [propertyId] });
		},
		[DiffType.TogglePropertyAnimated]: (diff: TogglePropertyAnimatedDiff) => {
			const { propertyId } = diff;
			const { compositionState } = actionState;

			if (propertyDoesNotAffectComposition(propertyId)) {
				return;
			}

			const property = compositionState.properties[propertyId];
			const layer = compositionState.layers[property.layerId];
			ctx.layers.updatePropertyStructure(layer, actionState);
		},
		[DiffType.ModifyMultipleLayerProperties]: (diff: ModifyMultipleLayerPropertiesDiff) => {
			const { propertyIds } = diff;
			performChange({ propertyIds });
		},
		[DiffType.LayerParent]: (diff: LayerParentDiff) => {
			const { layerId } = diff;
			ctx.layers.onUpdateLayerParent(layerId, actionState);
			executePerformables(ctx, actionState, layerId, [Performable.UpdateTransform]);
		},
		[DiffType.PropertyStructure]: (diff: PropertyStructureDiff) => {
			const { layerId } = diff;
			const layer = actionState.compositionState.layers[layerId];
			ctx.layers.updatePropertyStructure(layer, actionState);
		},
		[DiffType.ModifierOrder]: (diff: PropertyStructureDiff) => {
			const { layerId } = diff;
			const layer = actionState.compositionState.layers[layerId];
			ctx.layers.updatePropertyStructure(layer, actionState);
		},
		[DiffType.ResizeAreas]: () => {},
		[DiffType.ModifyCompositionView]: (diff: ModifyCompositionViewDiff) => {
			ctx.layers.onScaleChange(actionState, diff.scale);
		},
		[DiffType.CompositionSelection]: (diff: CompositionSelectionDiff) => {
			if (diff.compositionId !== compositionId) {
				return;
			}

			ctx.layers.onSelectionChange(actionState);
		},
	};

	propertyManagerDiffHandler(
		compositionId,
		ctx.properties,
		actionState,
		diffs,
		direction,
		ctx.prevState,
	);

	for (const diff of diffs) {
		if (direction === "backward") {
			const fn = backwardHandlers[diff.type];
			if (fn) {
				fn(diff);
				continue;
			}
		}
		const fn = forwardHandlers[diff.type];
		if (!fn) {
			console.warn(`No handler for diff of type '${diff.type}'.`);
			continue;
		}
		fn(diff);
	}

	ctx.layers.sendDiffs(actionState, diffs, direction);

	if (shouldUpdateZIndices) {
		updateLayerZIndices(composition, ctx.layers);
	}

	ctx.prevState = getActionStateFromApplicationState(store.getState());
};
