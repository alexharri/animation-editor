import { action } from "typesafe-actions";
import { CardinalDirection } from "~/types";

export const areaActions = {
	setJoinAreasPreview: (
		areaId: string | null,
		from: CardinalDirection | null,
		eligibleAreaIds: string[],
	) => {
		return action("area/SET_JOIN_PREVIEW", { areaId, from, eligibleAreaIds });
	},

	joinAreas: (areaRowId: string, areaIndex: number, mergeInto: -1 | 1) => {
		return action("area/JOIN", { areaRowId, areaIndex, mergeInto });
	},

	insertAreaIntoRow: (rowId: string, basedOnId: string, insertIndex: number) => {
		return action("area/INSERT_INTO_ROW", { rowId, basedOnId, insertIndex });
	},

	convertAreaToRow: (
		areaId: string,
		cornerParts: [CardinalDirection, CardinalDirection],
		horizontal: boolean,
	) => {
		return action("area/CONVERT_TO_ROW", { areaId, cornerParts, horizontal });
	},

	setRowSizes: (rowId: string, sizes: number[]) => {
		return action("area/SET_ROW_SIZES", { rowId, sizes });
	},
};
