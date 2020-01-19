import { TOOLBAR_HEIGHT } from "~/constants";

export const getAreaRootViewport = () => {
	const viewport: Rect = {
		top: TOOLBAR_HEIGHT,
		left: 0,
		height: window.innerHeight - TOOLBAR_HEIGHT,
		width: window.innerWidth,
	};
	return viewport;
};
