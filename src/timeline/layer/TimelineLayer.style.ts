import { cssVariables } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		display: flex;
		padding-left: 16px;
		background: ${cssVariables.dark700};
		border-radius: 2px;
		margin-bottom: 1px;
		margin-top: 1px;
		min-width: 320px;
	`,

	property: css`
		padding-left: 48px;
	`,

	property__label: css`
		color: ${cssVariables.white500};
	`,

	graphWrapper: css`
		width: 48px;
		display: flex;
	`,

	graph: css`
		height: 16px;
		width: 16px;
		margin-right: 2px;
		position: relative;
		cursor: pointer;

		svg {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 14px;
			height: 14px;
			fill: ${cssVariables.light300};
			transform: translate(-50%, -50%);
		}

		&--active {
			svg {
				fill: ${cssVariables.primary500};
			}
		}
	`,

	openGraphInArea: css`
		height: 16px;
		width: 16px;
		position: relative;
		cursor: grab;

		&:active {
			cursor: grabbing;
		}

		svg {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 14px;
			height: 14px;
			fill: ${cssVariables.light300};
			transform: translate(-50%, -50%);
		}

		&--active {
			svg {
				fill: ${cssVariables.primary500};
			}
		}
	`,

	collapsedArrow: css`
		width: 16px;
		height: 16px;
		position: relative;

		&--open {
			transform: translate(0, 0px) rotate(90deg);
		}

		&:before,
		&:after {
			content: "";
			position: absolute;
			top: 7px;
			left: 4px;
			right: 6px;
			height: 1px;
			transform-origin: 100% 50%;
			background: ${cssVariables.light300};
		}

		&:before {
			transform: rotate(45deg);
		}

		&:after {
			transform: rotate(-45deg);
		}
	`,
});
