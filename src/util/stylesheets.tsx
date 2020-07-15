import { css, keyframes } from "emotion";

export interface StyleParams {
	css: typeof css;
	keyframes: typeof keyframes;
}

type StylesheetFn = (params: StyleParams) => any;

function createGetterFn<K>(
	compiledStylesheet: any,
): (name: K, modifiers?: { [key: string]: boolean }) => string {
	return (name: K, modifiers: { [key: string]: boolean } = {}): string => {
		let className = compiledStylesheet[name] || "";

		const mods = Object.keys(modifiers);
		for (let i = 0; i < mods.length; i += 1) {
			const modifier = mods[i];

			if (modifiers[modifier]) {
				className += ` ${compiledStylesheet[name]}--${modifier}`;
			}
		}

		return className;
	};
}

export const compileStylesheet = <T extends StylesheetFn, K = keyof ReturnType<T>>(
	stylesheet: T,
) => {
	return createGetterFn<K>(stylesheet({ css, keyframes }));
};

export const compileStylesheetLabelled = <T extends StylesheetFn, K = keyof ReturnType<T>>(
	stylesheet: T,
) => {
	const obj = stylesheet({ css: (...args: any[]) => args as any, keyframes });
	const newObj = Object.keys(obj).reduce<any>((newObj, key) => {
		newObj[key] = `${key} ${css(...obj[key])}`;
		return newObj;
	}, {});
	return createGetterFn<K>(newObj);
};
