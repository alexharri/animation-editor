import { TIMELINE_SEPARATOR_WIDTH } from "~/constants";
import { cssCursors, cssVariables, cssZIndex } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	wrapper: css`
		display: flex;
	`,

	layer: css`
		border: 1px solid red;
		border-radius: 4px;
	`,

	left: css`
		background: ${cssVariables.dark600};
		margin-right: ${TIMELINE_SEPARATOR_WIDTH}px;
		display: flex;
		flex-direction: column;
	`,

	right: css`
		background: ${cssVariables.gray500};
		overflow: hidden;
	`,

	separator: css`
		position: absolute;
		top: 0;
		bottom: 0;
		width: ${TIMELINE_SEPARATOR_WIDTH}px;
		background: ${cssVariables.dark300};
		cursor: ew-resize;

		&:before {
			content: "";
			position: absolute;
			top: 0;
			left: -2px;
			right: -2px;
			bottom: 0;
			z-index: 1;
		}
	`,

	zoomTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: ${cssCursors.zoom.zoomIn};
		z-index: ${cssZIndex.graphEditor.zoomTarget};
	`,

	panTarget: css`
		display: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		cursor: ${cssCursors.grab.default};
		z-index: ${cssZIndex.graphEditor.panTarget};
	`,
});
