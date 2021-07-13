import { createAction } from "typesafe-actions";
import { AreaReducerState } from "~/area/state/areaReducer";
import { AreaType } from "~/constants";
import { CardinalDirection } from "~/types";
import { Area, AreaRowOrientation, AreaState } from "~/types/areaTypes";

export const areaActions = {
	setFields: createAction("area/SET_FIELDS", (action) => {
		return (fields: Partial<AreaReducerState>) => action({ fields });
	}),

	setJoinAreasPreview: createAction("area/SET_JOIN_PREVIEW", (action) => {
		return (areaId: string | null, from: CardinalDirection | null, eligibleAreaIds: string[]) =>
			action({ areaId, from, eligibleAreaIds });
	}),

	joinAreas: createAction("area/JOIN_AREAS", (action) => {
		return (areaRowId: string, areaIndex: number, mergeInto: -1 | 1) =>
			action({ areaRowId, areaIndex, mergeInto });
	}),

	insertAreaIntoRow: createAction("area/INSERT_AREA_INTO_ROW", (action) => {
		return (rowId: string, area: Area, insertIndex: number) =>
			action({ rowId, area, insertIndex });
	}),

	convertAreaToRow: createAction("area/CONVERT_AREA_TO_ROW", (action) => {
		return (
			areaId: string,
			cornerParts: [CardinalDirection, CardinalDirection],
			horizontal: boolean,
		) => action({ areaId, cornerParts, horizontal });
	}),

	setRowSizes: createAction("area/SET_ROW_SIZES", (action) => {
		return (rowId: string, sizes: number[]) => action({ rowId, sizes });
	}),

	wrapAreaInRow: createAction("area/WRAP_AREA_ROW", (action) => {
		return (areaId: string, orientation: AreaRowOrientation) => action({ areaId, orientation });
	}),

	setAreaType: createAction("area/SET_TYPE", (action) => {
		return <T extends AreaType>(areaId: string, type: T, initialState?: AreaState<T>) =>
			action({ areaId, type, initialState });
	}),

	dispatchToAreaState: createAction("area/DISPATCH_TO_AREA_STATE", (_action) => {
		return (areaId: string, action: any) => _action({ areaId, action });
	}),
};
