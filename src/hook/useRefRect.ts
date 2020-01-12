import { useState, useEffect } from "react";

const getRefRect = <T extends HTMLElement>(ref: React.RefObject<T>): Rect => {
	if (!ref.current) {
		throw new Error("Cannot get ref of null 'React.RefObject'");
	}

	const el = ref.current;
	const rect = el.getBoundingClientRect();

	return {
		top: rect.top,
		left: rect.left,
		width: rect.width,
		height: rect.height,
	};
};

export const useRefRect = <T extends HTMLElement>(ref: React.RefObject<T>): Rect | null => {
	const [rect, setRect] = useState(ref.current ? getRefRect(ref) : null);

	useEffect(() => {
		const onResize = () => {
			setRect(ref.current ? getRefRect(ref) : null);
		};

		let unmounted = false;

		window.addEventListener("resize", onResize);

		if (!rect) {
			setTimeout(() => !unmounted && onResize());
		}

		return () => {
			unmounted = true;
			window.removeEventListener("resize", onResize);
		};
	}, []);

	return rect;
};
