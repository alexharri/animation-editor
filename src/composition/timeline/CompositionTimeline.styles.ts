import { StyleParams } from "~/util/stylesheets";
import { cssVariables, cssZIndex } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	header: css`
		height: 24px;
	`,

	wrapper: css`
		display: flex;
	`,

	layer: css`
		border: 1px solid red;
		border-radius: 4px;
	`,

	left: css`
		background: ${cssVariables.dark600};
		margin-right: 4px;
	`,

	right: css`
		background: ${cssVariables.gray500};
		overflow: hidden;
	`,

	scrubContainer: css`
		height: 24px;
		position: relative;
		z-index: 1;
		background: ${cssVariables.dark700};
	`,

	scrubHead: css`
		height: 16px;
		background: red;
		width: 17px;
		position: absolute;
		top: 8px;
		transform: translateX(-50%);
		cursor: grab;
	`,

	scrubLine: css`
		position: absolute;
		top: 0;
		left: 8px;
		width: 1px;
		background: red;
	`,

	separator: css`
		position: absolute;
		top: 0;
		bottom: 0;
		background: ${cssVariables.dark700};
		cursor: ew-resize;
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
