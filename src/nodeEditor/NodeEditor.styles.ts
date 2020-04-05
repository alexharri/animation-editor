import { StyleParams } from "~/util/stylesheets";
import { cssVariables, cssZIndex } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: ${cssVariables.dark700};
	`,

	panTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: grab;
		z-index: ${cssZIndex.nodeEditor.panTarget};
	`,

	zoomTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: zoom-in;
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
