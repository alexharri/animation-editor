import { AreaState } from "~/area/state/areaReducer";

export const computeAreaRowToMinSize = (areaState: AreaState) => {
	const rowToMinSize: { [areaId: string]: { width: number; height: number } } = {};

	const root = areaState.layout[areaState.rootId];

	if (root.type === "area") {
		return {};
	}

	function compute(id: string): { height: number; width: number } {
		const layout = areaState.layout[id];

		if (layout.type === "area") {
			return { width: 1, height: 1 };
		}

		const result = { height: 0, width: 0 };

		const items = layout.areas.map(item => {
			return compute(item.id);
		});

		if (layout.orientation === "horizontal") {
			result.width = items.reduce((acc, item) => acc + item.width, 0);
			result.height = Math.max(...items.map(item => item.height));
		} else {
			result.height = items.reduce((acc, item) => acc + item.height, 0);
			result.width = Math.max(...items.map(item => item.width));
		}

		rowToMinSize[id] = result;
		return result;
	}

	rowToMinSize[areaState.rootId] = compute(areaState.rootId);

	return rowToMinSize;
};
