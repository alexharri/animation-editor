import { LayerManager } from "~/composition/manager/layer/LayerManager";
import { PropertyManager } from "~/composition/manager/property/propertyManager";
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
	PropertyStructureDiff,
	RemoveLayerDiff,
	TogglePropertyAnimatedDiff,
	UpdateNodeConnectionDiff,
} from "~/diff/diffs";
import { getFlowNodeAssociatedCompositionId } from "~/flow/flowUtils";

export const layerManagerDiffHandler = (
	compositionId: string,
	layerManager: LayerManager,
	propertyManager: PropertyManager,
	actionState: ActionState,
	diffs: Diff[],
	direction: "forward" | "backward",
	prevState: ActionState,
) => {
	let shouldUpdateZIndices = false;

	const onAddLayers = (layerIds: string[]) => {
		shouldUpdateZIndices = true;
		for (const layerId of layerIds) {
			const layer = actionState.compositionState.layers[layerId];
			if (layer.compositionId !== compositionId) {
				continue;
			}

			layerManager.addLayer(actionState, layerId);
		}
	};
	const onRemoveLayers = (layerIds: string[]) => {
		shouldUpdateZIndices = true;
		for (const layerId of layerIds) {
			const layer = prevState.compositionState.layers[layerId];
			if (layer.compositionId !== compositionId) {
				continue;
			}

			layerManager.removeLayer(layerId);
		}
	};

	const nodeDoesNotAffectComposition = (nodeId: string, state = actionState) => {
		return compositionId !== getFlowNodeAssociatedCompositionId(nodeId, state);
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
		const actions = propertyManager.getActionsToPerform(actionState, options);
		for (const { layerId, performables } of actions) {
			for (const performable of performables) {
				layerManager.executePerformable(actionState, layerId, performable);
			}
		}
	};

	const backwardHandlers: { [diffType: number]: (diff: any) => void } = {
		[DiffType.AddLayer]: (diff: AddLayerDiff) => {
			onRemoveLayers(diff.layerIds);
		},
		[DiffType.RemoveLayer]: (diff: RemoveLayerDiff) => {
			onAddLayers(diff.layerIds);
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

			layerManager.onFrameIndexChanged(actionState, diff.frameIndex);

			const actions = propertyManager.getActionsToPerformOnFrameIndexChange(actionState);
			for (const { layerId, performables } of actions) {
				for (const performable of performables) {
					layerManager.executePerformable(actionState, layerId, performable);
				}
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
			layerManager.updatePropertyStructure(actionState, property.layerId);
		},
		[DiffType.ModifyMultipleLayerProperties]: (diff: ModifyMultipleLayerPropertiesDiff) => {
			const { propertyIds } = diff;
			if (propertyDoesNotAffectComposition(propertyIds[0])) {
				return;
			}
			performChange({ propertyIds });
		},
		[DiffType.LayerParent]: (diff: LayerParentDiff) => {
			const { layerId } = diff;
			if (layerDoesNotAffectComposition(layerId)) {
				return;
			}
			layerManager.onUpdateLayerParent(actionState, layerId);
		},
		[DiffType.PropertyStructure]: (diff: PropertyStructureDiff) => {
			const { layerId } = diff;
			if (layerDoesNotAffectComposition(layerId)) {
				return;
			}
			layerManager.updatePropertyStructure(actionState, layerId);
		},
		[DiffType.ModifierOrder]: (diff: PropertyStructureDiff) => {
			const { layerId } = diff;
			if (layerDoesNotAffectComposition(layerId)) {
				return;
			}
			layerManager.updatePropertyStructure(actionState, layerId);
		},
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
			continue;
		}
		fn(diff);
	}

	if (shouldUpdateZIndices) {
		layerManager.updateLayerZIndices(actionState);
	}
};
