import { AreaReducerState } from "~/area/state/areaReducer";

export const computeAreaToParentRow = (areaState: AreaReducerState) => {
	const areaToParentRow: { [key: string]: string } = {};

	const keys = Object.keys(areaState.layout);
	for (let i = 0; i < keys.length; i += 1) {
		const layout = areaState.layout[keys[i]];

		if (layout.type === "area") {
			continue;
		}

		for (let j = 0; j < layout.areas.length; j += 1) {
			areaToParentRow[layout.areas[j].id] = layout.id;
		}
	}

	return areaToParentRow;
};
