import { StyleParams } from "~/util/stylesheets";
import { cssZIndex, cssCursors } from "~/cssVariables";
import { AREA_BORDER_WIDTH } from "~/constants";

export default ({ css }: StyleParams) => ({
	container: css`
		position: absolute;
		z-index: ${cssZIndex.area.joinPreview};
	`,

	arrowContainer: css`
		position: absolute;
		top: ${AREA_BORDER_WIDTH}px;
		left: ${AREA_BORDER_WIDTH}px;
		right: ${AREA_BORDER_WIDTH}px;
		bottom: ${AREA_BORDER_WIDTH}px;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		opacity: 0;

		&:hover {
			opacity: 1;
		}

		&--n {
			cursor: ${cssCursors.arrowBold.up};
		}
		&--s {
			cursor: ${cssCursors.arrowBold.down};
		}
		&--w {
			cursor: ${cssCursors.arrowBold.left};
		}
		&--e {
			cursor: ${cssCursors.arrowBold.right};
		}
	`,

	arrow: css`
		position: absolute;

		&--n {
			bottom: 0;
			left: 50%;
			transform: translateX(-50%) rotate(180deg);
		}
		&--s {
			top: 0;
			left: 50%;
			transform: translateX(-50%);
		}
		&--w {
			right: 0;
			top: 50%;
			transform: translateY(-50%) rotate(90deg);
		}
		&--e {
			left: 0;
			top: 50%;
			transform: translateY(-50%) rotate(-90deg);
		}

		svg {
			fill: rgba(0, 0, 0, 0.3);
		}
	`,
});
