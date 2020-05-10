import { keys, modifierKeys } from "~/constants";
import { elementHasKeyboardFocus } from "~/util/focus";

type Key = keyof typeof keys;

export const keyCodes = (Object.keys(keys) as Array<keyof typeof keys>).reduce<{
	[keyCode: number]: keyof typeof keys;
}>((obj, key) => {
	obj[keys[key]] = key;
	return obj;
}, {});

let keyPressMap: { [key: string]: boolean } = {};

export const getKeyFromKeyCode = (keyCode: number): Key | null => {
	return keyCodes[keyCode];
};

export const isKeyDown = (key: Key) => {
	return !!keyPressMap[keys[key]];
};

const _listeners: { [key: string]: Array<(isKeyDown: boolean) => void> } = {};

window.addEventListener("keydown", (e: KeyboardEvent) => {
	if (elementHasKeyboardFocus()) {
		return;
	}

	keyPressMap[e.keyCode] = true;
	const key = getKeyFromKeyCode(e.keyCode);
	_listeners[key!] && _listeners[key!].forEach((fn) => fn(true));
});
window.addEventListener("keyup", (e: KeyboardEvent) => {
	if (elementHasKeyboardFocus()) {
		return;
	}

	const key = keyCodes[e.keyCode];
	if (key === "Command" || key === "Alt" || key === "Control") {
		keyPressMap = {};
		Object.keys(_listeners).forEach((listenerKey) => {
			_listeners[listenerKey].forEach((fn) => fn(false));
		});
	} else {
		keyPressMap[e.keyCode] = false;
		Object.keys(_listeners).forEach((listenerKey) => {
			_listeners[listenerKey].forEach((fn) => fn(false));
		});
	}
});

export const isAnyModifierKeyDown = (): boolean => {
	for (let i = 0; i < modifierKeys.length; i += 1) {
		if (isKeyDown(modifierKeys[i])) {
			return true;
		}
	}
	return false;
};

export const isKeyCodeOf = (key: Key, keyCode: number) => keys[key] === keyCode;

export const addKeyDownChangeListener = (key: Key, fn: (isKeyDown: boolean) => void) => {
	if (!_listeners[key]) {
		_listeners[key] = [];
	}
	_listeners[key].push(fn);
};

export const removeKeyDownChangeListener = (key: Key, fn: (isKeyDown: boolean) => void) => {
	if (!_listeners[key]) {
		return;
	}
	_listeners[key] = _listeners[key].filter((_fn) => _fn !== fn);
};
