import { reduceCompProperties } from "~/composition/compositionUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { areaActionStateFromState, getActionState } from "~/state/stateUtils";
import { timelineOperations } from "~/timeline/operations/timelineOperations";
import { KeyboardShortcut, ShouldAddShortcutToStackFn } from "~/types";

const getAreaActionState = (areaId: string, actionState = getActionState()) =>
	areaActionStateFromState<AreaType.Timeline>(areaId, actionState);

const getSelectedTimelineIds = (areaId: string, actionState = getActionState()) => {
	const { compositionId } = getAreaActionState(areaId, actionState);
	const { compositionState, compositionSelectionState } = actionState;

	const compositionSelection = getCompSelectionFromState(
		compositionId,
		compositionSelectionState,
	);

	// All selected timeline ids in the composition
	const timelineIds = reduceCompProperties<string[]>(
		compositionId,
		compositionState,
		(acc, property) => {
			if (property.timelineId && compositionSelection.properties[property.id]) {
				acc.push(property.timelineId);
			}
			return acc;
		},
		[],
	);
	return timelineIds;
};

export const timelineShortcuts = {
	removeSelectedKeyframes: (areaId: string, params: RequestActionParams) => {
		const { compositionId } = getAreaActionState(areaId);
		const timelineIds = getSelectedTimelineIds(areaId);

		const op = createOperation();
		timelineOperations.removeSelectedKeyframes(op, timelineIds, compositionId);

		params.dispatch(op.actions);
	},

	easeEaseSelectedKeyframes: (areaId: string, params: RequestActionParams) => {
		const timelineIds = getSelectedTimelineIds(areaId);

		const op = createOperation();
		timelineOperations.easyEaseSelectedKeyframes(op, timelineIds);

		params.dispatch(op.actions);
	},
};

const wereKeyframesRemoved: ShouldAddShortcutToStackFn = (areaId, prevState, nextState) => {
	const timelineIds = getSelectedTimelineIds(areaId, prevState);

	for (const timelineId of timelineIds) {
		const a = prevState.timelineState[timelineId];
		const b = nextState.timelineState[timelineId];

		if (!b) {
			// Timeline was removed because all keyframes were selected
			return true;
		}

		if (a.keyframes.length !== b.keyframes.length) {
			return true;
		}
	}

	return false;
};

export const timelineKeyboardShortcuts: KeyboardShortcut[] = [
	{
		name: "Remove selected keyframes",
		key: "Backspace",
		fn: timelineShortcuts.removeSelectedKeyframes,
		shouldAddToStack: wereKeyframesRemoved,
	},
	{
		name: "Remove selected keyframes",
		key: "Delete",
		fn: timelineShortcuts.removeSelectedKeyframes,
		shouldAddToStack: wereKeyframesRemoved,
	},
	{
		name: "Easy ease selected keyframes",
		key: "F9",
		fn: timelineShortcuts.easeEaseSelectedKeyframes,
	},
];
