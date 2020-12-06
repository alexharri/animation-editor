import { compositionKeyboardShortcuts } from "~/composition/compositionShortcuts";
import { AreaType } from "~/constants";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { areaActionStateFromState, getActionState } from "~/state/stateUtils";
import { timelineOperations } from "~/timeline/operations/timelineOperations";
import { getSelectedTimelineIdsInComposition } from "~/timeline/timelineUtils";
import { KeyboardShortcut, ShouldAddShortcutToStackFn } from "~/types";

const getAreaActionState = (areaId: string, actionState = getActionState()) =>
	areaActionStateFromState<AreaType.Timeline>(areaId, actionState);

const getSelectedTimelineIds = (areaId: string, actionState = getActionState()) => {
	const { compositionId } = getAreaActionState(areaId, actionState);
	const { compositionState, compositionSelectionState } = actionState;

	return getSelectedTimelineIdsInComposition(
		compositionId,
		compositionState,
		compositionSelectionState,
	);
};

const timelineShortcuts = {
	removeSelectedKeyframes: (areaId: string, params: RequestActionParams) => {
		const { compositionId } = getAreaActionState(areaId);
		const timelineIds = getSelectedTimelineIds(areaId);

		const op = createOperation(params);
		timelineOperations.removeSelectedKeyframes(op, timelineIds, compositionId);

		params.dispatch(op.actions);
	},

	easeEaseSelectedKeyframes: (areaId: string, params: RequestActionParams) => {
		const timelineIds = getSelectedTimelineIds(areaId);

		const op = createOperation(params);
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
	...compositionKeyboardShortcuts,
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
