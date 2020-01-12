import { AreaRowLayout } from "~/types/areaTypes";
import { CardinalDirection } from "~/types";

const insertAtStart = (
	cornerParts: [CardinalDirection, CardinalDirection],
	horizontal: boolean,
): boolean => {
	if (horizontal) {
		return cornerParts.includes("w");
	}
	return cornerParts.includes("n");
};

export const areaToRow = (
	rowId: string,
	idForOldArea: string,
	idForNewArea: string,
	horizontal: boolean,
	cornerParts: [CardinalDirection, CardinalDirection],
): AreaRowLayout => {
	const rowAreas: Array<AreaRowLayout["areas"][number]> = [{ size: 1, id: idForOldArea }];

	rowAreas.splice(insertAtStart(cornerParts, horizontal) ? 0 : 1, 0, {
		size: 0,
		id: idForNewArea,
	});

	const row: AreaRowLayout = {
		type: "area_row",
		id: rowId,
		areas: rowAreas,
		orientation: horizontal ? "horizontal" : "vertical",
	};

	return row;
};
