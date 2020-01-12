import { useState, useEffect } from "react";
import { css, keyframes } from "emotion";

export interface StyleParams {
	css: typeof css;
	keyframes: typeof keyframes;
}

type StylesheetFn = (params: StyleParams) => any;

export type GetClassnameFunction<T extends StylesheetFn, K = keyof ReturnType<T>> = (
	name: K,
	modifiers?: { [key: string]: boolean },
) => string;

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

export const useStylesheet = <T extends StylesheetFn, K = keyof ReturnType<T>>(
	stylesheet: T,
): GetClassnameFunction<T, K> => {
	const getStylesheet = () => stylesheet({ css, keyframes });

	const [compiledStylesheet, setCompiledStylesheet] = useState(getStylesheet);

	useEffect(() => {
		setCompiledStylesheet(getStylesheet());
	}, [stylesheet]);

	return createGetterFn<K>(compiledStylesheet);
};
