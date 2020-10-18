import { useEffect, useRef } from "react";
import { areaKeyboardShortcutRegistry } from "~/area/areaRegistry";
import { AreaType, keys } from "~/constants";
import { addListener, removeListener } from "~/listener/addListener";
import { getKeyFromKeyCode, isKeyDown } from "~/listener/keyboard";
import { requestAction, ShouldAddToStackFn } from "~/listener/requestAction";
import { KeyboardShortcut } from "~/types";
import { isVecInRect } from "~/util/math";
import { getMousePosition } from "~/util/mouse";

const modifierKeys = ["Command", "Alt", "Shift"] as const;

type Key = keyof typeof keys;

export const useAreaKeyboardShortcuts = (areaId: string, areaType: AreaType, viewport: Rect) => {
	const viewportRef = useRef(viewport);
	viewportRef.current = viewport;

	useEffect(() => {
		const keyboardShortcuts = [...(areaKeyboardShortcutRegistry[areaType] || [])];

		/**
		 * "Best" is defined as the keyboard shortcut with the highest number of
		 * modifier keys which has all of its modifier keys down.
		 */
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

			for (const key of modifierKeys) {
				if (
					isKeyDown(key) &&
					!(shortcut.modifierKeys || []).includes(key) &&
					!(shortcut.optionalModifierKeys || []).includes(key)
				) {
					// Additional modifier keys beyond what the shortcut requires were
					// down.
					//
					// Do not execute shortcut.
					return;
				}
			}

			const { history = true } = shortcut;

			let shouldAddToStack: ShouldAddToStackFn | undefined;

			if (shortcut.shouldAddToStack) {
				shouldAddToStack = (prevState, nextState) => {
					return shortcut.shouldAddToStack!(areaId, prevState, nextState);
				};
			}

			requestAction({ history, shouldAddToStack }, (params) => {
				shortcut.fn(areaId, params);
				params.submitAction(shortcut.name);
			});
		});

		return () => {
			removeListener(token);
		};
	}, []);
};
