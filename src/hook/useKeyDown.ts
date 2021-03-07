import { useEffect, useState } from "react";
import {
	addKeyDownChangeListener,
	isKeyDown,
	Key,
	removeKeyDownChangeListener,
} from "~/listener/keyboard";
import { KeyDownMap } from "~/types";
import { reduceIds } from "~/util/mapUtils";

export const useKeyDownEffect = (key: Key, callback: (isKeyDown: boolean) => void): void => {
	useEffect(() => {
		addKeyDownChangeListener(key, { allowRepeated: false }, callback);
		return () => removeKeyDownChangeListener(key, callback);
	}, []);
};

export const useKeyDownListEffect = <K extends Key>(
	keys: K[],
	callback: (map: KeyDownMap<K>) => void,
): void => {
	useEffect(() => {
		const callbackFn = () => callback(reduceIds(keys, (key) => isKeyDown(key)));

		for (const key of keys) {
			addKeyDownChangeListener(key, { allowRepeated: false }, callbackFn);
		}
		return () => {
			for (const key of keys) {
				removeKeyDownChangeListener(key, callbackFn);
			}
		};
	}, []);
};

export const useKeyDown = (key: Key): boolean => {
	const [isDown, setIsDown] = useState(isKeyDown(key));

	useEffect(() => {
		addKeyDownChangeListener(key, { allowRepeated: false }, setIsDown);
		return () => removeKeyDownChangeListener(key, setIsDown);
	}, []);

	return isDown;
};
