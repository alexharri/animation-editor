import { CompositionContext } from "~/composition/manager/compositionContext";
import { executePerformables } from "~/composition/manager/executePerformables";
import { Performable } from "~/composition/manager/performableManager";
import { updateLayerZIndices } from "~/composition/manager/updateCompositionLayerZIndices";
import { Diff, DiffType } from "~/diff/diffs";
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
	const compLayers = new Set(composition.layers);

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
				case DiffType.RemoveFlowNode: {
					const { nodeId } = diff;
					const { flowState, compositionState } = actionState;
					const { graphId } = flowState.nodes[nodeId];
					const { layerId } = flowState.graphs[graphId];
					const layer = compositionState.layers[layerId];
					if (layer.compositionId !== compositionId) {
						// Does not affect this composition
						continue;
					}

					ctx.properties.updateStructure(actionState);

					// Find the affected nodes in the previous state
					const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes(
						[nodeId],
						actionState,
					);

					const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);
					for (const { layerId, performables } of actions) {
						executePerformables(ctx, actionState, layerId, performables);
					}
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
					const map = ctx.layers.getLayerPropertyMap(layerId);
					const xId = map[PropertyName.PositionX];
					const yId = map[PropertyName.PositionY];

					ctx.properties.onPropertyIdsChanged([xId, yId], actionState);

					const x = ctx.properties.getPropertyValue(xId);
					const y = ctx.properties.getPropertyValue(yId);

					const container = ctx.layers.getLayerTransformContainer(layerId);
					container.position.set(x, y);
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
				const animatedPropertyIds = ctx.layers.getAnimatedPropertyIds();
				ctx.properties.onPropertyIdsChanged(
					animatedPropertyIds,
					actionState,
					diff.frameIndex,
				);
				ctx.properties.onFrameIndexChanged(actionState, diff.frameIndex);
				ctx.layers.onFrameIndexChanged(actionState, diff.frameIndex);

				for (const { layerId, performables } of actions) {
					executePerformables(ctx, actionState, layerId, performables);
				}
				break;
			}
			case DiffType.FlowNodeState: {
				const { nodeId } = diff;

				if (nodeDoesNotAffectComposition(nodeId)) {
					continue;
				}

				ctx.properties.onNodeStateChange(nodeId, actionState);

				const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes(
					[nodeId],
					actionState,
				);
				const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);

				for (const { layerId, performables } of actions) {
					executePerformables(ctx, actionState, layerId, performables);
				}
				break;
			}
			case DiffType.FlowNodeExpression: {
				const { nodeId } = diff;

				if (nodeDoesNotAffectComposition(nodeId)) {
					continue;
				}

				ctx.properties.onNodeExpressionChange(nodeId, actionState);

				const propertyIds = ctx.properties.getPropertyIdsAffectedByNodes(
					[nodeId],
					actionState,
				);
				const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);

				for (const { layerId, performables } of actions) {
					executePerformables(ctx, actionState, layerId, performables);
				}
				break;
			}
			case DiffType.AddFlowNode: {
				const { nodeId } = diff;

				if (nodeDoesNotAffectComposition(nodeId)) {
					continue;
				}

				// A newly added node does not affect the rest of the graph until
				// connections are made. However, we need to register the node for
				// future operation.
				ctx.properties.updateStructure(actionState);
				break;
			}
			case DiffType.RemoveFlowNode: {
				const { nodeId } = diff;
				const { flowState, compositionState } = ctx.prevState;
				const { graphId } = flowState.nodes[nodeId];
				const { layerId } = flowState.graphs[graphId];
				const layer = compositionState.layers[layerId];
				if (layer.compositionId !== compositionId) {
					// Does not affect this composition
					continue;
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
				break;
			}
			case DiffType.UpdateNodeConnection: {
				const { nodeIds } = diff;

				if (nodeDoesNotAffectComposition(nodeIds[0])) {
					continue;
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
				break;
			}
			case DiffType.Layer: {
				const { layerIds } = diff;
				for (const layerId of layerIds) {
					executePerformables(ctx, actionState, layerId, [Performable.DrawLayer]);
				}
				break;
			}
			case DiffType.ModifyProperty: {
				const { propertyId } = diff;

				const property = actionState.compositionState.properties[propertyId];

				if (property.compositionId !== compositionId) {
					break;
				}

				ctx.properties.onPropertyIdsChanged([propertyId], actionState);
				const actions = ctx.layers.getActionsToPerform(actionState, [propertyId]);
				for (const { layerId, performables } of actions) {
					executePerformables(ctx, actionState, layerId, performables);
				}
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
				const { propertyIds } = diff;
				ctx.properties.onPropertyIdsChanged(propertyIds, actionState);
				const actions = ctx.layers.getActionsToPerform(actionState, propertyIds);
				for (const { layerId, performables } of actions) {
					executePerformables(ctx, actionState, layerId, performables);
				}
				break;
			}
			case DiffType.LayerParent: {
				const { layerId } = diff;
				ctx.layers.onUpdateLayerParent(layerId, actionState);
				executePerformables(ctx, actionState, layerId, [Performable.UpdateTransform]);
				break;
			}
			case DiffType.LayerIndexOrLength: {
				const composition = actionState.compositionState.compositions[compositionId];
				ctx.layers.onFrameIndexChanged(actionState, composition.frameIndex);
			}
		}
	}

	ctx.layers.sendDiffs(actionState, diffs, direction);

	if (shouldUpdateZIndices) {
		updateLayerZIndices(composition, ctx.layers);
	}

	ctx.prevState = getActionStateFromApplicationState(store.getState());
};
