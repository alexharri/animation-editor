import { useEffect, useRef } from "react";
import { areaKeyboardShortcutRegistry } from "~/area/areaRegistry";
import { AreaType, keys } from "~/constants";
import { addListener, removeListener } from "~/listener/addListener";
import { getKeyFromKeyCode, isKeyDown } from "~/listener/keyboard";
import { requestAction, ShouldAddToStackFn } from "~/listener/requestAction";
import { KeyboardShortcut } from "~/types";
import { isVecInRect } from "~/util/math";
import { getMousePosition } from "~/util/mouse";

type Key = keyof typeof keys;

export const useAreaKeyboardShortcuts = (areaId: string, areaType: AreaType, viewport: Rect) => {
	const viewportRef = useRef(viewport);
	viewportRef.current = viewport;

	useEffect(() => {
		const keyboardShortcuts = areaKeyboardShortcutRegistry[areaType] || [];

		const findBestShortcut = (key: Key) => {
			let keyboardShortcut: KeyboardShortcut | null = null;
			let nModifierKeys = -Infinity;

			keyboardShortcuts: for (const item of keyboardShortcuts) {
				if (item.key !== key) {
					continue;
				}

				if (item.modifierKeys) {
					for (const modifierKey of item.modifierKeys) {
						if (!isKeyDown(modifierKey)) {
							continue keyboardShortcuts;
						}
					}
				}

				// Keyboard shortcut is valid

				const currNModifierKeys = (item.modifierKeys || []).length;
				if (currNModifierKeys <= nModifierKeys) {
					continue;
				}

				keyboardShortcut = item;
				nModifierKeys = currNModifierKeys;
			}

			return keyboardShortcut;
		};

		const token = addListener.repeated("keydown", (e) => {
			const mousePosition = getMousePosition();
			const key = getKeyFromKeyCode(e.keyCode);

			if (!isVecInRect(mousePosition, viewportRef.current) || !key) {
				return;
			}

			const shortcut = findBestShortcut(key);

			if (!shortcut) {
				return;
			}

			let shouldAddToStack: ShouldAddToStackFn | undefined;

			if (shortcut.shouldAddToStack) {
				shouldAddToStack = (prevState, nextState) => {
					console.log({ prevState, nextState });
					return shortcut.shouldAddToStack!(areaId, prevState, nextState);
				};
			}

			requestAction({ history: true, shouldAddToStack }, (params) => {
				shortcut.fn(areaId, params);
				params.submitAction(shortcut.name);
			});
		});

		return () => {
			removeListener(token);
		};
	}, []);
};
