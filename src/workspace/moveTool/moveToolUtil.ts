import { compSelectionActions } from "~/composition/compositionSelectionReducer";
import {
	getTimelineIdsReferencedByComposition,
	reduceLayerPropertiesAndGroups,
} from "~/composition/compositionUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { getActionState } from "~/state/stateUtils";
import { timelineSelectionActions } from "~/timeline/timelineActions";
import { Operation } from "~/types";

export const moveToolUtil = {
	addLayerToSelection: (op: Operation, layerId: string) => {
		const { compositionState } = getActionState();
		const layer = compositionState.layers[layerId];
		op.add(compSelectionActions.addLayerToSelection(layer.compositionId, layerId));
	},

	removeLayerFromSelection: (op: Operation, layerId: string) => {
		const { compositionState } = getActionState();
		const layer = compositionState.layers[layerId];
		op.add(compSelectionActions.removeLayersFromSelection(layer.compositionId, [layerId]));
	},

	clearCompositionSelection: (op: Operation, compositionId: string) => {
		const { compositionState } = getActionState();

		// Clear composition selection
		op.add(compSelectionActions.clearCompositionSelection(compositionId));

		// Clear timeline selection of selected properties
		const timelineIds = getTimelineIdsReferencedByComposition(compositionId, compositionState);
		op.add(...timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)));
	},

	deselectLayerProperties: (op: Operation, layerId: string) => {
		const { compositionState, compositionSelectionState } = getActionState();
		const { compositionId } = compositionState.layers[layerId];
		const compositionSelection = compSelectionFromState(
			compositionId,
			compositionSelectionState,
		);

		// Deselect all properties and timeline keyframes
		const propertyIds = reduceLayerPropertiesAndGroups<string[]>(
			layerId,
			compositionState,
			(acc, property) => {
				acc.push(property.id);
				return acc;
			},
			[],
		).filter((propertyId) => compositionSelection.properties[propertyId]);

		const timelineIds = propertyIds.reduce<string[]>((acc, propertyId) => {
			const property = compositionState.properties[propertyId];

			if (property.type === "property" && property.timelineId) {
				acc.push(property.timelineId);
			}

			return acc;
		}, []);

		op.add(
			compSelectionActions.removePropertiesFromSelection(compositionId, propertyIds),
			...timelineIds.map((timelineId) => timelineSelectionActions.clear(timelineId)),
		);
	},
};
