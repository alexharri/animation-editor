import { AreaReducerState } from "~/area/state/areaReducer";
import { isVecInRect } from "~/util/math";

export const getAreaToOpenTargetId = (
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
