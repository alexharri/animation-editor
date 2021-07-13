import { AREA_PLACEMENT_TRESHOLD } from "~/area/state/areaConstants";
import { AreaReducerState } from "~/area/state/areaReducer";
import { isVecInRect } from "~/util/math";

export const getHoveredAreaId = (
	position: Vec2,
	areaState: AreaReducerState,
	areaToViewport: {
		[areaId: string]: Rect;
	},
): string | undefined => {
	let areaId: string | undefined;

	const keys = Object.keys(areaState.areas);
	for (let i = 0; i < keys.length; i += 1) {
		if (areaState.layout[keys[i]].type !== "area") {
			continue;
		}

		const areaViewport = areaToViewport[keys[i]];
		if (isVecInRect(position, areaViewport)) {
			areaId = keys[i];
			break;
		}
	}

	return areaId;
};

export type PlaceArea = "top" | "left" | "right" | "bottom" | "replace";

export const getAreaToOpenPlacementInViewport = (rect: Rect, position: Vec2): PlaceArea => {
	const w = rect.width;
	const h = rect.height;

	const x = position.x - rect.left;
	const y = position.y - rect.top;

	let placement: PlaceArea | undefined;
	let dist = Infinity;

	const treshold = Math.min(w, h) * AREA_PLACEMENT_TRESHOLD;

	const tests: Array<{ placement: PlaceArea; dist: number }> = [
		{ placement: "left", dist: x },
		{ placement: "top", dist: y },
		{ placement: "right", dist: w - x },
		{ placement: "bottom", dist: h - y },
	];

	for (const test of tests) {
		if (test.dist < treshold && test.dist < dist) {
			dist = test.dist;
			placement = test.placement;
		}
	}

	if (!placement) {
		return "replace";
	}

	return placement;
};
