import { Layer } from "~/composition/compositionTypes";
import { CompositionContext } from "~/composition/manager/compositionContext";
import { manageComposition } from "~/composition/manager/compositionManager";
import {
	createPerformableManager,
	PerformableManager,
} from "~/composition/manager/performableManager";
import { Diff } from "~/diff/diffs";
import { layerToPixi } from "~/render/pixi/layerToPixi";
import { LayerType } from "~/types";

export interface LayerManager {
	addLayer: (layer: Layer, actionState: ActionState) => void;
	removeLayer: (layer: Layer) => void;
	getLayerContainer: (layerId: string) => PIXI.Container;
	sendDiffs: (actionState: ActionState, diffs: Diff[], direction: "forward" | "backward") => void;
	getActionToPerform: PerformableManager["getActionToPerform"];
	getActionsToPerform: PerformableManager["getActionsToPerform"];
	getActionsToPerformOnFrameIndexChange: PerformableManager["getActionsToPerformOnFrameIndexChange"];
	updatePropertyStructure: (layer: Layer, actionState: ActionState) => void;
}

export const createLayerManager = (getContext: () => CompositionContext): LayerManager => {
	const layerToContainer: Record<string, PIXI.Container> = {};
	const subCompositions: Record<string, { manager: ReturnType<typeof manageComposition> }> = {};
	const performableManager = createPerformableManager();

	return {
		addLayer: (layer: Layer, actionState: ActionState) => {
			const ctx = getContext();

			// Create PIXI container and add to registry
			const container = layerToPixi(actionState, layer);
			layerToContainer[layer.id] = container;

			// Add the layer to the composition container
			ctx.container.addChild(container);

			if (layer.type === LayerType.Composition) {
				// The layer is a composition layer.
				//
				// We don't render the composition directly. Instead we create a
				// sub-composition manager which takes care of keeping the content
				// of the layer container up to date.
				const { compositionState } = actionState;
				const compositionId = compositionState.compositionLayerIdToComposition[layer.id];
				const manager = manageComposition(compositionId, container);
				subCompositions[layer.id] = { manager };
			}

			performableManager.addLayer(actionState, layer.id);
		},

		removeLayer: (layer: Layer) => {
			// Destroy the PIXI container
			const container = layerToContainer[layer.id];
			container.parent.removeChild(container);
			container.destroy();

			// Remove the container from the registry
			delete layerToContainer[layer.id];

			if (layer.type === LayerType.Composition) {
				// The layer is a composition layer.
				//
				// Remove the sub-composition manager.
				const { manager } = subCompositions[layer.id];
				manager.destroy();
			}

			performableManager.removeLayer(layer.id);
		},

		getLayerContainer: (layerId: string) => {
			return layerToContainer[layerId];
		},

		// Send some diffs to the sub-composition managers.
		//
		// Those composition managers will send the diffs to their sub-composition
		// managers and so on.
		sendDiffs: (actionState: ActionState, diffs: Diff[], direction: "forward" | "backward") => {
			const keys = Object.keys(subCompositions);
			for (const key of keys) {
				const { manager } = subCompositions[key];
				manager.onDiffs(actionState, diffs, direction);
			}
		},

		updatePropertyStructure: (layer, actionState) => {
			performableManager.onUpdateLayerStructure(actionState, layer.id);
		},

		getActionToPerform: performableManager.getActionToPerform,

		getActionsToPerform: performableManager.getActionsToPerform,

		getActionsToPerformOnFrameIndexChange:
			performableManager.getActionsToPerformOnFrameIndexChange,
	};
};
