import { constructLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
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
import { TRANSFORM_PROPERTY_NAMES } from "~/types";

export const propertyManagerDiffHandler = (
	compositionId: string,
	properties: PropertyManager,
	actionState: ActionState,
	diffs: Diff[],
	direction: "forward" | "backward",
	prevState: ActionState,
) => {
	const onAddLayers = (layerIds: string[]) => {
		for (const layerId of layerIds) {
			const layer = actionState.compositionState.layers[layerId];
			if (layer.compositionId !== compositionId) {
				continue;
			}
			properties.addLayer(actionState);
		}
	};
	const onRemoveLayers = (layerIds: string[]) => {
		for (const layerId of layerIds) {
			const layer = prevState.compositionState.layers[layerId];
			if (layer.compositionId !== compositionId) {
				continue;
			}
			properties.removeLayer(actionState);
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

	const backwardHandlers: { [diffType: number]: (diff: any) => void } = {
		[DiffType.AddLayer]: (diff: AddLayerDiff) => onRemoveLayers(diff.layerIds),
		[DiffType.RemoveLayer]: (diff: RemoveLayerDiff) => onAddLayers(diff.layerIds),
	};

	const forwardHandlers: { [diffType: number]: (diff: any) => void } = {
		[DiffType.AddLayer]: (diff: AddLayerDiff) => onAddLayers(diff.layerIds),
		[DiffType.RemoveLayer]: (diff: RemoveLayerDiff) => onRemoveLayers(diff.layerIds),
		[DiffType.FrameIndex]: (diff: FrameIndexDiff) => {
			if (compositionId !== diff.compositionId) {
				return;
			}
			properties.onFrameIndexChanged(actionState, diff.frameIndex);
		},
		[DiffType.FlowNodeState]: (diff: FlowNodeStateDiff) => {
			const { nodeId } = diff;
			if (nodeDoesNotAffectComposition(diff.nodeId)) {
				return;
			}
			properties.onNodeStateChange(nodeId, actionState);
		},
		[DiffType.FlowNodeExpression]: (diff: FlowNodeExpressionDiff) => {
			const { nodeId } = diff;
			if (nodeDoesNotAffectComposition(nodeId)) {
				return;
			}
			properties.onNodeExpressionChange(nodeId, actionState);
		},
		[DiffType.AddFlowNode]: (diff: AddFlowNodeDiff) => {
			if (nodeDoesNotAffectComposition(diff.nodeId)) {
				return;
			}

			// A newly added node does not affect the rest of the graph until
			// connections are made. However, we need to register the node for
			// future operation.
			//
			// Right now those "future operations" just include changing the
			// value (state) of the recently added node.
			properties.updateStructure(actionState);
		},
		[DiffType.UpdateNodeConnection]: (diff: UpdateNodeConnectionDiff) => {
			if (nodeDoesNotAffectComposition(diff.nodeIds[0], prevState)) {
				return;
			}
			properties.updateStructure(actionState);
		},
		[DiffType.Layer]: (_diff: LayerDiff) => {
			// This diff is used when a property changed that the property manager
			// does not care about. Currently only used for shape layers.
			//
			// When paths become animatable, this diff should be removed in favor
			// of the standard "properties modified" diff.
		},
		[DiffType.ModifyProperty]: (diff: ModifyPropertyDiff) => {
			const { propertyId } = diff;
			if (propertyDoesNotAffectComposition(propertyId)) {
				return;
			}
			properties.onPropertyIdsChanged([propertyId], actionState);
		},
		[DiffType.TogglePropertyAnimated]: (diff: TogglePropertyAnimatedDiff) => {
			if (propertyDoesNotAffectComposition(diff.propertyId)) {
				return;
			}
			properties.updateStructure(actionState);
		},
		[DiffType.ModifyMultipleLayerProperties]: (diff: ModifyMultipleLayerPropertiesDiff) => {
			const propertyIds = diff.propertyIds.filter(
				(propertyId) => !propertyDoesNotAffectComposition(propertyId),
			);
			properties.onPropertyIdsChanged(propertyIds, actionState);
		},
		[DiffType.LayerParent]: (diff: LayerParentDiff) => {
			if (layerDoesNotAffectComposition(diff.layerId)) {
				return;
			}
			const map = constructLayerPropertyMap(diff.layerId, actionState.compositionState);
			const transformPropertyIds = TRANSFORM_PROPERTY_NAMES.map((name) => map[name]);
			properties.onPropertyIdsChanged(transformPropertyIds, actionState);
		},
		[DiffType.PropertyStructure]: (diff: PropertyStructureDiff) => {
			if (layerDoesNotAffectComposition(diff.layerId)) {
				return;
			}
			properties.updateStructure(actionState);
		},
		[DiffType.ModifierOrder]: (diff: PropertyStructureDiff) => {
			if (layerDoesNotAffectComposition(diff.layerId)) {
				return;
			}
			properties.updateStructure(actionState);
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
};
