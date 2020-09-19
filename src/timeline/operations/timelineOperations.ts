import { compositionActions } from "~/composition/compositionReducer";
import { findCompProperty } from "~/composition/compositionUtils";
import { getActionState } from "~/state/stateUtils";
import { timelineActions } from "~/timeline/timelineActions";
import { TimelineKeyframeControlPoint } from "~/timeline/timelineTypes";
import { getTimelineValueAtIndex, timelineSelectionFromState } from "~/timeline/timelineUtils";
import { Operation } from "~/types";

const removeTimeline = (op: Operation, timelineId: string, compositionId: string): void => {
	const { compositionState, timelineState } = getActionState();

	const timeline = timelineState[timelineId];
	const composition = compositionState.compositions[compositionId];
	const { frameIndex } = composition;
	const property = findCompProperty(compositionId, compositionState, (property) => {
		return property.timelineId === timelineId;
	})!;
	const { index } = compositionState.layers[property.layerId];

	const value = getTimelineValueAtIndex({ frameIndex, layerIndex: index, timeline });
	op.add(compositionActions.setPropertyValue(property.id, value));

	// Find all properties that reference timeline ID

	const propertyIds = Object.keys(compositionState.properties);

	for (const propertyId of propertyIds) {
		const property = compositionState.properties[propertyId];

		if (property.type !== "property" || property.timelineId !== timelineId) {
			continue;
		}

		op.add(compositionActions.setPropertyTimelineId(propertyId, ""));
	}

	op.add(timelineActions.removeTimeline(timelineId));
};

const removeSelectedKeyframes = (
	op: Operation,
	timelineIds: string[],
	compositionId: string,
): void => {
	const { timelineState, timelineSelectionState } = getActionState();

	for (const timelineId of timelineIds) {
		const timeline = timelineState[timelineId];
		const selection = timelineSelectionFromState(timelineId, timelineSelectionState);
		const keyframeIds = Object.keys(selection.keyframes);

		let allKeyframesSelected = true;
		for (const k of timeline.keyframes) {
			if (!selection.keyframes[k.id]) {
				allKeyframesSelected = false;
				break;
			}
		}

		if (allKeyframesSelected) {
			// Timeline should be removed
			removeTimeline(op, timelineId, compositionId);
			continue;
		}

		op.add(timelineActions.removeKeyframes(timelineId, keyframeIds));
	}
};

const easyEaseSelectedKeyframes = (op: Operation, timelineIds: string[]): void => {
	const { timelineState, timelineSelectionState } = getActionState();

	for (const timelineId of timelineIds) {
		const timeline = timelineState[timelineId];
		const selection = timelineSelectionFromState(timelineId, timelineSelectionState);

		for (let i = 0; i < timeline.keyframes.length; i++) {
			const k = timeline.keyframes[i];

			if (!selection.keyframes[k.id]) {
				continue;
			}

			const t = 0.33;
			const cp = (tx: number): TimelineKeyframeControlPoint => ({
				value: 0,
				relativeToDistance: 1,
				tx,
			});
			op.add(
				timelineActions.setKeyframeControlPoint(timelineId, i, "left", cp(1 - t)),
				timelineActions.setKeyframeControlPoint(timelineId, i, "right", cp(t)),
				timelineActions.setKeyframeReflectControlPoints(timelineId, i, true),
			);
		}
	}
};

export const timelineOperations = {
	removeTimeline,
	removeSelectedKeyframes,
	easyEaseSelectedKeyframes,
};
