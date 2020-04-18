import { Json, JsonObject } from "~/types";
import { AreaState } from "~/area/state/areaReducer";

const key = "__SAVED_AREA_STATE";

const parseItem = (item: Json): any => {
	if (Array.isArray(item)) {
		return item.map(parseItem);
	}

	if (typeof item === "object") {
		if (!item) {
			return item;
		}

		if (item.__objectType === "vec2") {
			return Vec2.new(item.x as number, item.y as number);
		}

		return Object.keys(item).reduce<JsonObject>((obj, key) => {
			obj[key] = parseItem(item[key]);
			return obj;
		}, {});
	}

	return item;
};

export const getSavedAreaState = (): AreaState | null => {
	const json = localStorage.getItem(key);

	if (!json) {
		return null;
	}

	try {
		const parsedJson = JSON.parse(json);
		return parseItem(parsedJson);
	} catch (e) {
		return null;
	}
};

export const saveAreaState = (areaState: AreaState): void => {
	const json = JSON.stringify(areaState);
	localStorage.setItem(key, json);
};
