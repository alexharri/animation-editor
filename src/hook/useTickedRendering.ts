import { useEffect, useRef } from "react";
import { keys } from "~/constants";
import { useActionStateEffect } from "~/hook/useActionState";
import { addListener, removeListener } from "~/listener/addListener";
import { isKeyCodeOf } from "~/listener/keyboard";

type Key = keyof typeof keys;

export const useTickedRendering = <K extends Key, KeyMap extends Partial<{ [_ in K]: boolean }>>(
	{
		render: renderFn,
		shouldUpdate: shouldUpdateFn,
		keyDown,
	}: {
		render: (options: { keyDown: KeyMap }) => void;
		shouldUpdate: (prevState: ActionState, nextState: ActionState) => boolean;
		keyDown: KeyMap;
	},
	dependencies: React.DependencyList,
) => {
	const shouldRenderRef = useRef(true);
	const keyDownRef = useRef<KeyMap>({} as any);

	useEffect(() => {
		shouldRenderRef.current = true;
	}, dependencies);

	useActionStateEffect((nextState, prevState) => {
		if (shouldRenderRef.current) {
			return;
		}
		shouldRenderRef.current = shouldUpdateFn(prevState, nextState);
	});

	useEffect(() => {
		const tokens: string[] = [];

		const keys = Object.keys(keyDown || {}) as K[];

		tokens.push(
			addListener.repeated("keydown", (e) => {
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					if (isKeyCodeOf(key, e.keyCode)) {
						shouldRenderRef.current = true;
						keyDownRef.current[key] = true as KeyMap[K];
						break;
					}
				}
			}),

			addListener.repeated("keyup", (e) => {
				for (let i = 0; i < keys.length; i++) {
					const key = keys[i];
					if (isKeyCodeOf(key, e.keyCode)) {
						shouldRenderRef.current = true;
						keyDownRef.current[key] = false as KeyMap[K];
						break;
					}
				}
			}),
		);

		return () => {
			for (const token of tokens) {
				removeListener(token);
			}
		};
	}, []);

	useEffect(() => {
		let mounted = true;

		const tick = () => {
			if (mounted) {
				requestAnimationFrame(tick);
			}

			if (!shouldRenderRef.current) {
				return;
			}

			shouldRenderRef.current = false;
			renderFn({ keyDown: keyDownRef.current });
		};
		tick();

		return () => {
			mounted = false;
		};
	}, []);
};
