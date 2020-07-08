import { useEffect } from "react";

export const useMouseEventOutside = <T extends HTMLElement>(
	eventType: "mousedown" | "mouseup" | "click",
	ref: React.RefObject<T>,
	cb: (e: MouseEvent) => void,
) => {
	const listener = (e: MouseEvent) => {
		if (ref.current?.contains(e.target as HTMLElement)) {
			cb(e);
		}
	};

	useEffect(() => {
		window.addEventListener(eventType, listener);

		return () => window.removeEventListener(eventType, listener);
	});
};
