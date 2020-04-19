import { StyleParams } from "~/util/stylesheets";

export const VIEWBOUNDS_HEIGHT = 8;

export default ({ css }: StyleParams) => ({
	viewBounds: css`
		height: ${VIEWBOUNDS_HEIGHT}px;
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
});
