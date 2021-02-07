import { CompositionContext } from "~/composition/manager/compositionContext";
import { executePerformables } from "~/composition/manager/executePerformables";
import { Performable } from "~/composition/manager/performableManager";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";
import {
	AddFlowNodeDiff,
	AddLayerDiff,
	Diff,
	DiffType,
	FlowNodeExpressionDiff,
	FlowNodeStateDiff,
	FrameIndexDiff,
	LayerDiff,
	LayerParentDiff,
	ModifyMultipleLayerPropertiesDiff,
	ModifyPropertyDiff,
	MoveLayerDiff,
	PropertyStructureDiff,
	RemoveFlowNodeDiff,
	RemoveLayerDiff,
	TogglePropertyAnimatedDiff,
	UpdateNodeConnectionDiff,
} from "~/diff/diffs";
import { getFlowNodeAssociatedCompositionId } from "~/flow/flowUtils";
import { getActionStateFromApplicationState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { PropertyName } from "~/types";

export const compositionDiffHandler = (
	ctx: CompositionContext,
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

			ctx.properties.addLayer(actionState);
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

			ctx.properties.removeLayer(actionState);
			ctx.layers.removeLayer(layer);
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

			ctx.properties.updateStructure(actionState);

			// Find the affected nodes in the previous state
			const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes([nodeId], actionState);
			const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);

			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
		},
	};

	const forwardHandlers: { [diffType: number]: (diff: any) => void } = {
		[DiffType.AddLayer]: (diff: AddLayerDiff) => {
			onAddLayers(diff.layerIds);
		},
		[DiffType.RemoveLayer]: (diff: RemoveLayerDiff) => {
			onRemoveLayers(diff.layerIds);
		},
		[DiffType.MoveLayer]: (diff: MoveLayerDiff) => {
			const { layerIds } = diff;
			for (const layerId of layerIds) {
				if (layerDoesNotAffectComposition(layerId)) {
					break;
				}

				const map = ctx.layers.getLayerPropertyMap(layerId);
				const xId = map[PropertyName.PositionX];
				const yId = map[PropertyName.PositionY];

				ctx.properties.onPropertyIdsChanged([xId, yId], actionState);

				const x = ctx.properties.getPropertyValue(xId);
				const y = ctx.properties.getPropertyValue(yId);

				const container = ctx.layers.getLayerTransformContainer(layerId);
				container.position.set(x, y);
			}
		},
		[DiffType.FrameIndex]: (diff: FrameIndexDiff) => {
			if (compositionId !== diff.compositionId) {
				return;
			}

			const actions = ctx.layers.getActionsToPerformOnFrameIndexChange();
			const animatedPropertyIds = ctx.layers.getAnimatedPropertyIds();
			ctx.properties.onPropertyIdsChanged(animatedPropertyIds, actionState, diff.frameIndex);
			ctx.properties.onFrameIndexChanged(actionState, diff.frameIndex);
			ctx.layers.onFrameIndexChanged(actionState, diff.frameIndex);

			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
		},
		[DiffType.FlowNodeState]: (diff: FlowNodeStateDiff) => {
			const { nodeId } = diff;

			if (nodeDoesNotAffectComposition(nodeId)) {
				return;
			}

			ctx.properties.onNodeStateChange(nodeId, actionState);

			const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes([nodeId], actionState);
			const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);

			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
		},
		[DiffType.FlowNodeExpression]: (diff: FlowNodeExpressionDiff) => {
			const { nodeId } = diff;

			if (nodeDoesNotAffectComposition(nodeId)) {
				return;
			}

			ctx.properties.onNodeExpressionChange(nodeId, actionState);

			const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes([nodeId], actionState);
			const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);

			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
		},
		[DiffType.AddFlowNode]: (diff: AddFlowNodeDiff) => {
			const { nodeId } = diff;

			if (nodeDoesNotAffectComposition(nodeId)) {
				return;
			}

			// A newly added node does not affect the rest of the graph until
			// connections are made. However, we need to register the node for
			// future operation.
			ctx.properties.updateStructure(actionState);
		},
		[DiffType.RemoveFlowNode]: (diff: RemoveFlowNodeDiff) => {
			const { nodeId } = diff;
			const { flowState } = ctx.prevState;
			const { graphId } = flowState.nodes[nodeId];
			const { layerId } = flowState.graphs[graphId];

			if (layerDoesNotAffectComposition(layerId)) {
				return;
			}

			// Find the affected nodes in the previous state
			const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes(
				[nodeId],
				ctx.prevState,
			);

			ctx.properties.updateStructure(actionState);

			const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);
			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
		},
		[DiffType.UpdateNodeConnection]: (diff: UpdateNodeConnectionDiff) => {
			const { nodeIds } = diff;

			if (nodeDoesNotAffectComposition(nodeIds[0])) {
				return;
			}

			// Find the affected nodes in the previous state
			const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes(
				nodeIds,
				ctx.prevState,
			);

			ctx.properties.updateStructure(actionState);

			const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);
			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
		},
		[DiffType.Layer]: (diff: LayerDiff) => {
			const { layerIds } = diff;

			if (layerDoesNotAffectComposition(layerIds[0])) {
				return;
			}

			for (const layerId of layerIds) {
				executePerformables(ctx, actionState, layerId, [Performable.DrawLayer]);
			}
		},
		[DiffType.ModifyProperty]: (diff: ModifyPropertyDiff) => {
			const { propertyId } = diff;

			if (propertyDoesNotAffectComposition(propertyId)) {
				return;
			}

			ctx.properties.onPropertyIdsChanged([propertyId], actionState);
			const actions = ctx.layers.getActionsToPerform(actionState, [propertyId]);
			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
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
			ctx.properties.onPropertyIdsChanged(propertyIds, actionState);
			const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);
			for (const { layerId, performables } of actions) {
				executePerformables(ctx, actionState, layerId, performables);
			}
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
		[DiffType.ModifyCompositionView]: () => {},
	};

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
