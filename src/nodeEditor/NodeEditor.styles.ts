import { cssCursors, cssVariables, cssZIndex } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: ${cssVariables.dark800};
	`,

	panTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: ${cssCursors.grab.default};
		z-index: ${cssZIndex.nodeEditor.panTarget};
	`,

	zoomTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: ${cssCursors.zoom.zoomIn};
		z-index: ${cssZIndex.nodeEditor.zoomTarget};
	`,

	clickCaptureTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: none;
		z-index: ${cssZIndex.nodeEditor.clickCaptureTarget};
	`,
});
