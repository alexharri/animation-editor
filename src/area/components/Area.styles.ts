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
		background: ${cssVariables.gray400};
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

	selectAreaButton: css`
		position: absolute;
		top: 6px;
		left: 12px;
		z-index: 10;
		border: none;
		padding: 2px 6px;
		border-radius: 4px;
		outline: none;
		background: ${cssVariables.gray200};

		svg {
			fill: ${cssVariables.gray500};
			width: 12px;
			height: 12px;
		}
	`,

	selectArea: css`
		position: absolute;
		top: -32px;
		left: -32px;
		padding: 36px;
		z-index: 15;
		background: transparent;
	`,

	selectArea__inner: css`
		border: 1px solid ${cssVariables.gray500};
		background: ${cssVariables.gray300};
	`,

	selectArea__item: css`
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0 24px;
		background: ${cssVariables.gray300};
		display: block;
		width: 128px;
	`,
});
