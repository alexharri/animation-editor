import { TIMELINE_SCRUBBER_HEIGHT } from "~/constants";
import { cssVariables, cssZIndex } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	wrapper: css`
		position: relative;
		height: ${TIMELINE_SCRUBBER_HEIGHT}px;
	`,

	canvas: css`
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: ${cssZIndex.timeline.scrubber.canvas};
	`,

	interactionArea: css`
		height: ${TIMELINE_SCRUBBER_HEIGHT}px;
		position: relative;
		z-index: 1;
		background: ${cssVariables.dark500};
	`,

	head: css`
		height: 16px;
		background: red;
		width: 17px;
		position: absolute;
		top: 8px;
		transform: translateX(-50%);
		cursor: grab;
		pointer-events: none;
		z-index: ${cssZIndex.timeline.scrubber.head};
	`,

	scrubLine: css`
		position: absolute;
		top: 0;
		left: 8px;
		width: 1px;
		background: red;
		pointer-events: none;
	`,
});
