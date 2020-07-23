import { getActionState } from "~/state/stateUtils";
import { Json, JsonObject } from "~/types";

const key = "__SAVED_ACTION_STATE";

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

export const getSavedActionState = (): ActionState | null => {
	const json = localStorage.getItem(key);

	if (!json) {
		return null;
	}

	try {
		const parsedJson = JSON.parse(json);
		const parsed = parseItem(parsedJson) as ActionState | null;
		return parsed;
	} catch (e) {
		return null;
	}
};

export const saveActionState = (): void => {
	const actionState = getActionState();
	const json = JSON.stringify(actionState);
	localStorage.setItem(key, json);
};

(window as any).saveActionState = saveActionState;
