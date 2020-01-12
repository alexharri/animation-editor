import { AreaRowLayout, AreaLayout } from "~/types/areaTypes";

export const joinAreas = (
	row: AreaRowLayout,
	areaIndex: number,
	join: -1 | 1,
): { area: AreaRowLayout | AreaLayout; removedAreaId: string } => {
	if (areaIndex < 0 || areaIndex > row.areas.length - 1) {
		throw new Error("Index 'areaIndex' out of bounds");
	}

	const areaToRemoveIndex = areaIndex + join;
	if (areaToRemoveIndex < 0 || areaToRemoveIndex > row.areas.length - 1) {
		throw new Error("Index 'join' out of bounds");
	}

	if (row.areas.length === 2) {
		const area = row.areas[areaIndex];
		const removedArea = row.areas[areaToRemoveIndex];
		const newArea: AreaLayout = {
			type: "area",
			id: area.id,
		};
		return { area: newArea, removedAreaId: removedArea.id };
	}

	const area = row.areas[areaIndex];
	const areaToRemove = row.areas[areaToRemoveIndex];

	const newAreas = [...row.areas];
	newAreas[areaIndex] = {
		...area,
		size: area.size + areaToRemove.size,
	};
	newAreas.splice(areaToRemoveIndex, 1);

	const newRow: AreaRowLayout = {
		...row,
		areas: newAreas,
	};
	return { area: newRow, removedAreaId: areaToRemove.id };
};
