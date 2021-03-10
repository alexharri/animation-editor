import { Property } from "~/composition/compositionTypes";
import { forEachLayerProperty } from "~/composition/compositionUtils";
import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";

export const computeValueByPropertyIdForComposition = (
	actionState: ActionState,
	compositionId: string,
): Record<string, any> => {
	const rawValues: Record<string, any> = {};

	const { compositionState, timelineState, timelineSelectionState } = actionState;
	const composition = compositionState.compositions[compositionId];

	for (const layerId of composition.layers) {
		const layer = compositionState.layers[layerId];
		forEachLayerProperty(layer.id, actionState.compositionState, (property) => {
			const composition = compositionState.compositions[property.compositionId];
			const value = property.timelineId
				? getTimelineValueAtIndex({
						timeline: timelineState[property.timelineId],
						selection: timelineSelectionState[property.timelineId],
						frameIndex: composition.frameIndex,
						layerIndex: layer.index,
				  })
				: property.value;
			rawValues[property.id] = value;
		});
	}

	return rawValues;
};

export const updateRawValuesForPropertyIds = (
	actionState: ActionState,
	propertyIds: string[],
	propertyStore: PropertyStore,
	frameIndex?: number,
): void => {
	const { compositionState, timelineState, timelineSelectionState } = actionState;

	for (const propertyId of propertyIds) {
		const property = compositionState.properties[propertyId] as Property;
		const layer = compositionState.layers[property.layerId];
		const composition = compositionState.compositions[layer.compositionId];
		const value = property.timelineId
			? getTimelineValueAtIndex({
					timeline: timelineState[property.timelineId],
					selection: timelineSelectionState[property.timelineId],
					frameIndex: frameIndex ?? composition.frameIndex,
					layerIndex: layer.index,
			  })
			: property.value;
		propertyStore.setRawPropertyValue(property.id, value);
	}
};
