import { StyleParams } from "~/util/stylesheets";
import { cssZIndex } from "~/cssVariables";

const TIMELINE_HEADER_HEIGHT = 24;
const TIMELINE_VIEWBOUNDS_HEIGHT = 8;

export const TIMELINE_CANVAS_HEIGHT_REDUCTION = TIMELINE_HEADER_HEIGHT + TIMELINE_VIEWBOUNDS_HEIGHT;

export default ({ css }: StyleParams) => ({
	header: css`
		height: ${TIMELINE_HEADER_HEIGHT}px;
		background: green;
	`,

	viewBounds: css`
		height: ${TIMELINE_VIEWBOUNDS_HEIGHT}px;
		background: darkblue;
		position: relative;
		margin: 0;
	`,

	viewBounds__inner: css`
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background: blue;
		cursor: grab;
	`,

	viewBounds__handle: css`
		position: absolute;
		top: 0;
		bottom: 0;
		width: 6px;
		background: red;
		cursor: ew-resize;

		&--left {
			left: 0;
			transform: translate(-100%);
		}
		&--right {
			right: 0;
			transform: translate(100%);
		}
	`,

	zoomTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: zoom-in;
		z-index: ${cssZIndex.timelineEditor.zoomTarget};
	`,

	panTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: grab;
		z-index: ${cssZIndex.timelineEditor.panTarget};
	`,
});
