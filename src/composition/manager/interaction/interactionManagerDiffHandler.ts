import { InteractionManager } from "~/composition/manager/interaction/interactionManager";
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
	MouseMoveDiff,
	PropertyStructureDiff,
	RemoveFlowNodeDiff,
	RemoveLayerDiff,
	TogglePropertyAnimatedDiff,
	ToolDiff,
	UpdateNodeConnectionDiff,
} from "~/diff/diffs";

export const interactionManagerDiffHandler = (
	compositionId: string,
	interactions: InteractionManager,
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

			interactions.addLayer(actionState, layerId);
		}
	};
	const onRemoveLayers = (layerIds: string[]) => {
		for (const layerId of layerIds) {
			const layer = prevState.compositionState.layers[layerId];
			if (layer.compositionId !== compositionId) {
				continue;
			}

			interactions.removeLayer(layerId);
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
		[DiffType.FrameIndex]: (_diff: FrameIndexDiff) => {},
		[DiffType.FlowNodeState]: (_diff: FlowNodeStateDiff) => {},
		[DiffType.FlowNodeExpression]: (_diff: FlowNodeExpressionDiff) => {},
		[DiffType.AddFlowNode]: (_diff: AddFlowNodeDiff) => {},
		[DiffType.RemoveFlowNode]: (_diff: RemoveFlowNodeDiff) => {},
		[DiffType.UpdateNodeConnection]: (_diff: UpdateNodeConnectionDiff) => {},
		[DiffType.Layer]: (_diff: LayerDiff) => {},
		[DiffType.ModifyProperty]: (_diff: ModifyPropertyDiff) => {},
		[DiffType.TogglePropertyAnimated]: (_diff: TogglePropertyAnimatedDiff) => {},
		[DiffType.ModifyMultipleLayerProperties]: (_diff: ModifyMultipleLayerPropertiesDiff) => {},
		[DiffType.LayerParent]: (_diff: LayerParentDiff) => {},
		[DiffType.PropertyStructure]: (_diff: PropertyStructureDiff) => {},
		[DiffType.ModifierOrder]: (_diff: PropertyStructureDiff) => {},
		[DiffType.ResizeAreas]: () => {},
		[DiffType.MouseMove]: (diff: MouseMoveDiff) => {
			interactions.mouseMove(actionState, diff.mousePosition);
		},
		[DiffType.Tool]: (_diff: ToolDiff) => {
			interactions.onToolChange(actionState);
		},
		[DiffType.MouseOut]: (_diff: MouseMoveDiff) => {
			interactions.mouseOut(actionState);
		},
		[DiffType.ModifyCompositionView]: (diff: ModifyCompositionViewDiff) => {
			if (compositionId !== diff.compositionId) {
				return;
			}
			interactions.onScaleChange(actionState, diff.scale);
		},
		[DiffType.CompositionSelection]: (diff: CompositionSelectionDiff) => {
			if (diff.compositionId !== compositionId) {
				return;
			}

			const { compositionState } = actionState;
			const composition = compositionState.compositions[compositionId];

			for (const layerId of composition.layers) {
				interactions.update(actionState, layerId);
			}
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
			console.warn(`No handler for diff of type '${diff.type}'.`);
			continue;
		}
		fn(diff);
	}
};
