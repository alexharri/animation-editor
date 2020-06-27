export const removeKeysFromMap = <T extends { [key: string]: any }>(obj: T, keys: string[]): T => {
	return (Object.keys(obj) as Array<keyof T>).reduce<T>((newObj, key) => {
		if (keys.indexOf(key) === -1) {
			newObj[key] = obj[key];
		}
		return newObj;
	}, {} as T);
};

export const addListToMap = <M extends { [key: string]: T }, T>(
	map: M,
	items: T[],
	idField: keyof T,
): M => {
	return {
		...map,
		...items.reduce<M>((obj, item) => {
			const id = item[idField];
			(obj as any)[id] = item;
			return obj;
		}, {} as M),
	};
};

export const modifyItemInMap = <M extends { [key: string]: T }, T = M[string]>(
	map: M,
	id: string,
	fn: (item: T) => T,
): M => {
	return {
		...map,
		[id]: fn(map[id]),
	};
};
