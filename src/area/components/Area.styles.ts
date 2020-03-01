import { StyleParams } from "~/util/stylesheets";
import { cssVariables, cssZIndex } from "~/cssVariables";
import { AREA_BORDER_WIDTH } from "~/constants";

export default ({ css }: StyleParams) => ({
	area: css`
		background: ${cssVariables.gray200};
		position: absolute;
		z-index: ${cssZIndex.area.areaBase};

		&--raised {
			z-index: ${cssZIndex.area.areaRaised};
		}
	`,

	area__content: css`
		border-radius: 8px;
		background: ${cssVariables.gray500};
		position: absolute;
		z-index: 1;
		top: ${AREA_BORDER_WIDTH}px;
		left: ${AREA_BORDER_WIDTH}px;
		bottom: ${AREA_BORDER_WIDTH}px;
		right: ${AREA_BORDER_WIDTH}px;
		overflow: hidden;
	`,

	area__corner: css`
		width: 10px;
		height: 10px;
		position: absolute;
		z-index: 2;
		cursor: crosshair;

		&--nw {
			top: ${AREA_BORDER_WIDTH}px;
			left: ${AREA_BORDER_WIDTH}px;
		}

		&--ne {
			top: ${AREA_BORDER_WIDTH}px;
			right: ${AREA_BORDER_WIDTH}px;
		}

		&--sw {
			bottom: ${AREA_BORDER_WIDTH}px;
			left: ${AREA_BORDER_WIDTH}px;
		}

		&--se {
			bottom: ${AREA_BORDER_WIDTH}px;
			right: ${AREA_BORDER_WIDTH}px;
		}
	`,
});
