import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { VIEW_BOUNDS_HANDLE_WIDTH } from "~/constants";

const VIEWBOUNDS_HEIGHT = 8;

export default ({ css }: StyleParams) => ({
	viewBounds: css`
		height: ${VIEWBOUNDS_HEIGHT}px;
		position: relative;
		margin: 0;
		padding: 0 ${VIEW_BOUNDS_HANDLE_WIDTH}px;
		background: ${cssVariables.dark500};

		&:before {
			content: "";
			position: absolute;
			top: 0;
			bottom: 0;
			left: ${VIEW_BOUNDS_HANDLE_WIDTH}px;
			right: ${VIEW_BOUNDS_HANDLE_WIDTH}px;
			background: ${cssVariables.gray500};
		}
	`,

	viewBounds__inner: css`
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background: ${cssVariables.gray700};
		cursor: grab;
	`,

	viewBounds__handle: css`
		position: absolute;
		top: 0;
		bottom: 0;
		width: ${VIEW_BOUNDS_HANDLE_WIDTH}px;
		background: ${cssVariables.primary500};
		cursor: ew-resize;

		&--left {
			left: 0;
			border-top-left-radius: 4px;
			border-bottom-left-radius: 4px;
			transform: translate(-100%);
		}
		&--right {
			right: 0;
			border-top-right-radius: 4px;
			border-bottom-right-radius: 4px;
			transform: translate(100%);
		}
	`,
});
