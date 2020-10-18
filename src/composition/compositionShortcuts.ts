import { AreaType } from "~/constants";
import { RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { areaActionStateFromState, getActionState } from "~/state/stateUtils";
import { timelineOperations } from "~/timeline/operations/timelineOperations";
import { KeyboardShortcut, PropertyName } from "~/types";

const getAreaActionState = (areaId: string, actionState = getActionState()) =>
	areaActionStateFromState<AreaType.Timeline | AreaType.Workspace>(areaId, actionState);

const compositionShortcuts = {
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

export const compositionKeyboardShortcuts: KeyboardShortcut[] = [
	{
		name: "View animated properties",
		key: "U",
		fn: compositionShortcuts.viewAnimatedProperties,
	},
	{
		name: "View position property",
		key: "P",
		fn: compositionShortcuts.viewTransformProperties([
			PropertyName.PositionX,
			PropertyName.PositionY,
		]),
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
		fn: compositionShortcuts.viewTransformProperties([
			PropertyName.ScaleX,
			PropertyName.ScaleY,
		]),
		optionalModifierKeys: ["Shift"],
	},
	{
		name: "View anchor property",
		key: "A",
		fn: compositionShortcuts.viewTransformProperties([
			PropertyName.AnchorX,
			PropertyName.AnchorY,
		]),
		optionalModifierKeys: ["Shift"],
	},
];
