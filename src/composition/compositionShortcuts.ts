import { AreaType } from "~/constants";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { areaActionStateFromState, getActionState } from "~/state/stateUtils";
import { timelineOperations } from "~/timeline/operations/timelineOperations";
import { CompoundPropertyName, KeyboardShortcut, PropertyName } from "~/types";

const getAreaActionState = (areaId: string, actionState = getActionState()) =>
	areaActionStateFromState<AreaType.Timeline | AreaType.Workspace>(areaId, actionState);

const compositionShortcuts = {
	viewTransformProperties: (propertyNames: Array<PropertyName | CompoundPropertyName>) => (
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

export const compositionKeyboardShortcuts: KeyboardShortcut[] = [
	{
		name: "View animated properties",
		key: "U",
		fn: compositionShortcuts.viewAnimatedProperties,
	},
	{
		name: "View position property",
		key: "P",
		fn: compositionShortcuts.viewTransformProperties([CompoundPropertyName.Position]),
		optionalModifierKeys: ["Shift"],
	},
	{
		name: "View rotation property",
		key: "R",
		fn: compositionShortcuts.viewTransformProperties([PropertyName.Rotation]),
		optionalModifierKeys: ["Shift"],
	},
	{
		name: "View scale property",
		key: "S",
		fn: compositionShortcuts.viewTransformProperties([CompoundPropertyName.Scale]),
		optionalModifierKeys: ["Shift"],
	},
	{
		name: "View anchor property",
		key: "A",
		fn: compositionShortcuts.viewTransformProperties([CompoundPropertyName.Anchor]),
		optionalModifierKeys: ["Shift"],
	},
];
