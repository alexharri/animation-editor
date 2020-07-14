import { useEffect, useState } from "react";
import {
	addKeyDownChangeListener,
	removeKeyDownChangeListener,
	isKeyDown,
} from "~/listener/keyboard";
import { keys } from "~/constants";

export const useKeyDownEffect = (
	key: keyof typeof keys,
	callback: (isKeyDown: boolean) => void,
	dependencies?: React.DependencyList,
): void => {
	useEffect(() => {
		addKeyDownChangeListener(key, { allowRepeated: false }, callback);
		return () => removeKeyDownChangeListener(key, callback);
	}, dependencies ?? []);
};

export const useKeyDown = (key: keyof typeof keys): boolean => {
	const [isDown, setIsDown] = useState(isKeyDown(key));

	useEffect(() => {
		addKeyDownChangeListener(key, { allowRepeated: false }, setIsDown);
		return () => removeKeyDownChangeListener(key, setIsDown);
	}, []);

	return isDown;
};
