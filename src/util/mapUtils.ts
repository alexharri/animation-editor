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
	key: string,
	fn: (item: T) => T,
): M => {
	if (!map.hasOwnProperty(key)) {
		throw new Error(`Key '${key}' does not exist in map.`);
	}

	return {
		...map,
		[key]: fn(map[key]),
	};
};

export const modifyItemInUnionMap = <
	M extends { [key: string]: T },
	T = M[string],
	U extends T = T
>(
	map: M,
	key: string,
	fn: (item: U) => U,
): M => {
	if (!map.hasOwnProperty(key)) {
		throw new Error(`Key '${key}' does not exist in map.`);
	}

	return {
		...map,
		[key]: fn(map[key] as U),
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

export const isMapShallowEqual = <M extends { [key: string]: T }, T = M[string]>(
	a: M,
	b: M,
): boolean => {
	const keys = Object.keys(a);

	if (keys.length !== Object.keys(b).length) {
		return false;
	}

	for (let i = 0; i < keys.length; i += 1) {
		const key = keys[i];

		if (!b.hasOwnProperty(key)) {
			return false;
		}

		if (a[key] !== b[key]) {
			return false;
		}
	}

	return true;
};

export const createMapNumberId = <M extends { [key: string]: any }>(map: M): string => {
	const keys = Object.keys(map)
		.map((x) => parseInt(x))
		.filter((x) => !isNaN(x));
	const max = Math.max(0, ...keys);
	return (max + 1).toString();
};

export const createGenMapIdFn = <M extends { [key: string]: any }>(map: M): (() => string) => {
	const keys = Object.keys(map)
		.map((x) => parseInt(x))
		.filter((x) => !isNaN(x));

	return () => {
		const max = Math.max(0, ...keys);
		const n = max + 1;
		keys.push(n);
		return n.toString();
	};
};
