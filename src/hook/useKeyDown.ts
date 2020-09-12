import { useEffect, useState } from "react";
import { keys } from "~/constants";
import {
	addKeyDownChangeListener,
	isKeyDown,
	removeKeyDownChangeListener,
} from "~/listener/keyboard";

export const useKeyDownEffect = (
	key: keyof typeof keys,
	callback: (isKeyDown: boolean) => void,
): void => {
	useEffect(() => {
		addKeyDownChangeListener(key, { allowRepeated: false }, callback);
		return () => removeKeyDownChangeListener(key, callback);
	}, []);
};

export const useKeyDown = (key: keyof typeof keys): boolean => {
	const [isDown, setIsDown] = useState(isKeyDown(key));

	useEffect(() => {
		addKeyDownChangeListener(key, { allowRepeated: false }, setIsDown);
		return () => removeKeyDownChangeListener(key, setIsDown);
	}, []);

	return isDown;
};
