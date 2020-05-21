import { TOOLBAR_HEIGHT, AreaType, AREA_BORDER_WIDTH } from "~/constants";

export const getAreaRootViewport = () => {
	const viewport: Rect = {
		top: TOOLBAR_HEIGHT,
		left: 0,
		height: Math.floor(window.innerHeight - TOOLBAR_HEIGHT),
		width: Math.floor(window.innerWidth),
	};
	return viewport;
};

let viewportMap: { [key: string]: Rect } = {};

export const _setAreaViewport = (_viewportMap: { [key: string]: Rect }) => {
	viewportMap = _viewportMap;
};

export const getAreaViewport = (areaId: string, _: AreaType): Rect => {
	const viewport = viewportMap[areaId];

	const componentViewport: Rect = {
		left: viewport.left + AREA_BORDER_WIDTH,
		top: viewport.top + AREA_BORDER_WIDTH,
		width: viewport.width - AREA_BORDER_WIDTH * 2,
		height: viewport.height - AREA_BORDER_WIDTH * 2,
	};

	return componentViewport;
};
