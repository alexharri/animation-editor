import { useState, useRef } from "react";
import { animate } from "~/util/animation/animate";

export const useNumberTransitionState = (
	initialValue: number,
	options: { bezier?: [number, number, number, number]; duration?: number } = {},
): [number, (value: number) => void] => {
	const [value, _setValue] = useState(initialValue);

	let activeAnimationRef = useRef<ReturnType<typeof animate> | null>(null);

	const lastValRef = useRef(value);
	lastValRef.current = value;

	const setValue = (newValue: number) => {
		if (activeAnimationRef.current) {
			activeAnimationRef.current.cancel();
		}

		const promise = animate({ ...options, from: lastValRef.current, to: newValue }, (v) => {
			_setValue(v);
		});
		promise.then((cancelled) => {
			if (!cancelled) {
				activeAnimationRef.current = null;
			}
		});

		activeAnimationRef.current = promise;
	};

	return [value, setValue];
};

export const useVec2TransitionState = (
	initialValue: Vec2,
	options: { bezier?: [number, number, number, number]; duration?: number } = {},
): [Vec2, (value: Vec2) => void] => {
	const [value, _setValue] = useState(initialValue);

	let activeAnimationRef = useRef<ReturnType<typeof animate> | null>(null);

	const lastValRef = useRef(value);
	lastValRef.current = value;

	const setValue = (newValue: Vec2) => {
		if (activeAnimationRef.current) {
			activeAnimationRef.current.cancel();
		}

		const from = lastValRef.current;
		const promise = animate({ ...options, from: 0, to: 1 }, (t) => {
			_setValue(from.lerp(newValue, t));
		});
		promise.then((cancelled) => {
			if (!cancelled) {
				activeAnimationRef.current = null;
			}
		});

		activeAnimationRef.current = promise;
	};

	return [value, setValue];
};
