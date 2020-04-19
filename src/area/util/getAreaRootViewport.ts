import { TOOLBAR_HEIGHT } from "~/constants";

export const getAreaRootViewport = () => {
	const viewport: Rect = {
		top: TOOLBAR_HEIGHT,
		left: 0,
		height: Math.floor(window.innerHeight - TOOLBAR_HEIGHT),
		width: Math.floor(window.innerWidth),
	};
	return viewport;
};
