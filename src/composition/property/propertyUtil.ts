import { Property } from "~/composition/compositionTypes";
import { getActionState } from "~/state/stateUtils";
import { getTimelineValueAtIndex, timelineSelectionFromState } from "~/timeline/timelineUtils";

export const propertyUtil = {
	getValue: (propertyId: string) => {
		const { compositionState, timelineState, timelineSelectionState } = getActionState();

		const property = compositionState.properties[propertyId] as Property;

		if (property.timelineId) {
			const timeline = timelineState[property.timelineId];
			const timelineSelection = timelineSelectionFromState(
				timeline.id,
				timelineSelectionState,
			);
			const composition = compositionState.compositions[property.compositionId];
			const layer = compositionState.layers[property.layerId];
			return getTimelineValueAtIndex({
				frameIndex: composition.frameIndex,
				layerIndex: layer.index,
				timeline,
				selection: timelineSelection,
			});
		}

		return property.value;
	},
};
