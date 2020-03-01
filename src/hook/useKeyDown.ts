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
) => {
	useEffect(() => {
		addKeyDownChangeListener(key, callback);
		return () => removeKeyDownChangeListener(key, callback);
	}, []);
};

export const useKeyDown = (key: keyof typeof keys) => {
	const [isDown, setIsDown] = useState(isKeyDown(key));

	useEffect(() => {
		addKeyDownChangeListener(key, setIsDown);
		return () => removeKeyDownChangeListener(key, setIsDown);
	}, []);

	return isDown;
};
