import { areaActions } from "~/area/state/areaActions";
import { computeAreaToParentRow } from "~/area/util/areaToParentRow";
import { PlaceArea } from "~/area/util/areaUtils";
import { Operation } from "~/types";
import { Area, AreaRowLayout, AreaRowOrientation } from "~/types/areaTypes";

function dragArea(op: Operation, area: Area, targetAreaId: string, placement: PlaceArea) {
	op.add(areaActions.setFields({ areaToOpen: null }));

	const areaState = op.state.area;

	if (placement === "replace") {
		op.add(areaActions.setAreaType(targetAreaId, area.type, area.state));
		return;
	}

	let orientation: AreaRowOrientation;
	let iOff: 0 | 1;

	switch (placement) {
		case "top":
		case "left":
			iOff = 0;
			break;
		case "bottom":
		case "right":
			iOff = 1;
			break;
	}

	switch (placement) {
		case "bottom":
		case "top":
			orientation = "vertical";
			break;
		case "left":
		case "right":
			orientation = "horizontal";
			break;
	}

	const areaToParentRow = computeAreaToParentRow(areaState);

	const parentRow = areaState.layout[areaToParentRow[targetAreaId]] as AreaRowLayout | undefined;

	if (parentRow && parentRow.orientation === orientation) {
		const targetIndex = parentRow.areas.map((x) => x.id).indexOf(targetAreaId);
		const insertIndex = targetIndex + iOff;
		op.add(areaActions.insertAreaIntoRow(parentRow.id, area, insertIndex));

		const sizes = parentRow.areas.map((x) => x.size);
		const size = sizes[targetIndex] / 2;
		sizes.splice(targetIndex, 0, 1);
		sizes[targetIndex] = size;
		sizes[targetIndex + 1] = size;
		op.add(areaActions.setRowSizes(parentRow.id, sizes));
		return;
	}

	op.add(areaActions.wrapAreaInRow(targetAreaId, orientation));
	const newRowId = (areaState._id + 1).toString();
	op.add(areaActions.insertAreaIntoRow(newRowId, area, iOff));
	op.add(areaActions.setRowSizes(newRowId, [1, 1]));
	op.addDiff((diff) => diff.resizeAreas());
}

export const areaOperations = {
	dragArea,
};
