import { cssCursors, cssVariables, cssZIndex } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: ${cssVariables.dark600};
	`,

	panTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: ${cssCursors.grab.default};
		z-index: ${cssZIndex.flowEditor.panTarget};
	`,

	zoomTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: ${cssCursors.zoom.zoomIn};
		z-index: ${cssZIndex.flowEditor.zoomTarget};
	`,

	clickCaptureTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: none;
		z-index: ${cssZIndex.flowEditor.clickCaptureTarget};
	`,
});
