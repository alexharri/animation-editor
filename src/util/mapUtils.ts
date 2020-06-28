export const removeKeysFromMap = <T extends { [key: string]: any }>(obj: T, keys: string[]): T => {
	return (Object.keys(obj) as Array<keyof T>).reduce<T>((newObj, key) => {
		if (keys.indexOf(key) === -1) {
			newObj[key] = obj[key];
		}
		return newObj;
	}, {} as T);
};

export const addListToMap = <M extends { [key: string]: T }, T, U extends T = T>(
	map: M,
	items: U[],
	idField: keyof T & keyof U,
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

export const modifyItemInUnionMap = <
	M extends { [key: string]: T },
	T = M[string],
	U extends T = T
>(
	map: M,
	id: string,
	fn: (item: U) => U,
): M => {
	return {
		...map,
		[id]: fn(map[id] as U),
	};
};

export const reduceMap = <M extends { [key: string]: T }, T = M[string]>(
	map: M,
	fn: (item: T) => T,
): M => {
	const keys = Object.keys(map);
	return keys.reduce((obj, key) => {
		(obj as any)[key] = fn(map[key]);
		return obj;
	}, {} as M);
};
