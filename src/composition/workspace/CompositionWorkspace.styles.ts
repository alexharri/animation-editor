import { StyleParams } from "~/util/stylesheets";
import { cssVariables, cssZIndex } from "~/cssVariables";

const HEADER_HEIGHT = 24;
const FOOTER_HEIGHT = 24;

export default ({ css }: StyleParams) => ({
	header: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: ${HEADER_HEIGHT}px;
		background: ${cssVariables.gray500};
	`,

	footer: css`
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: ${FOOTER_HEIGHT}px;
		background: blue;
		display: flex;
		background: ${cssVariables.dark600};
		align-items: center;
	`,

	dimensionLabel: css`
		color: ${cssVariables.light500};
		font-family: ${cssVariables.fontFamily};
		font-size: 11px;
		line-height: 16px;
		pointer-events: none;
		margin-right: 4px;
		margin-left: 8px;

		&:first-of-type {
			margin-left: 24px;
		}
	`,

	container: css`
		position: absolute;
		top: ${HEADER_HEIGHT}px;
		left: 0;
		right: 0;
		bottom: ${FOOTER_HEIGHT}px;
		background: ${cssVariables.dark800};
		overflow: hidden;
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
