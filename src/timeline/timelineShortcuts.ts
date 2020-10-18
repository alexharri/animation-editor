import { reduceCompProperties } from "~/composition/compositionUtils";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { AreaType } from "~/constants";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { areaActionStateFromState, getActionState } from "~/state/stateUtils";
import { timelineOperations } from "~/timeline/operations/timelineOperations";
import { KeyboardShortcut, PropertyName, ShouldAddShortcutToStackFn } from "~/types";

const getAreaActionState = (areaId: string, actionState = getActionState()) =>
	areaActionStateFromState<AreaType.Timeline>(areaId, actionState);

const getSelectedTimelineIds = (areaId: string, actionState = getActionState()) => {
	const { compositionId } = getAreaActionState(areaId, actionState);
	const { compositionState, compositionSelectionState } = actionState;

	const compositionSelection = compSelectionFromState(compositionId, compositionSelectionState);

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

const timelineShortcuts = {
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

	viewTransformProperties: (propertyNames: PropertyName[]) => (
		areaId: string,
		params: RequestActionParams,
	) => {
		const { compositionId } = getAreaActionState(areaId);

		const op = createOperation();
		timelineOperations.viewTransformProperties(op, compositionId, propertyNames);

		params.dispatch(op.actions);
	},

	viewAnimatedProperties: (areaId: string, params: RequestActionParams) => {
		const { compositionId } = getAreaActionState(areaId);

		const op = createOperation();
		timelineOperations.viewAnimatedProperties(op, compositionId);

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
	{
		name: "View animated properties",
		key: "U",
		fn: timelineShortcuts.viewAnimatedProperties,
	},
	{
		name: "View position property",
		key: "P",
		fn: timelineShortcuts.viewTransformProperties([
			PropertyName.PositionX,
			PropertyName.PositionY,
		]),
		optionalModifierKeys: ["Shift"],
	},
	{
		name: "View rotation property",
		key: "R",
		fn: timelineShortcuts.viewTransformProperties([PropertyName.Rotation]),
		optionalModifierKeys: ["Shift"],
	},
	{
		name: "View scale property",
		key: "S",
		fn: timelineShortcuts.viewTransformProperties([PropertyName.ScaleX, PropertyName.ScaleY]),
		optionalModifierKeys: ["Shift"],
	},
	{
		name: "View anchor property",
		key: "A",
		fn: timelineShortcuts.viewTransformProperties([PropertyName.AnchorX, PropertyName.AnchorY]),
		optionalModifierKeys: ["Shift"],
	},
];
