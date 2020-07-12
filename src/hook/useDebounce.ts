import { useRef, useEffect } from "react";
import { ArgumentTypes } from "~/types";

export const useDebounce = <T extends Function>(timeMs: number, fn: T): T => {
	const timeoutRef = useRef<number>();

	useEffect(() => {
		return () => {
			window.clearTimeout(timeoutRef.current);
		};
	}, []);

	return ((...args: ArgumentTypes<T>) => {
		window.clearTimeout(timeoutRef.current);
		timeoutRef.current = window.setTimeout(() => fn(...args), timeMs);
	}) as any;
};
