import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		display: flex;
		padding-left: 24px;
		background: ${cssVariables.dark700};
		margin: 1px 0;
		border-radius: 2px;
	`,

	name: css`
		width: 98px;
		font-size: 11px;
		color: #bbb;
		line-height: 16px;
		padding: 0 3px;
		border-radius: 3px;
		cursor: default;
		margin-right: 4px;

		&--active {
			background-color: ${cssVariables.gray700};
		}
	`,

	property: css`
		padding-left: 48px;
	`,

	property__label: css`
		color: ${cssVariables.white500};
	`,

	graph: css`
		margin-left: 2px;
		height: 16px;
		width: 16px;
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
		margin-left: 2px;
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
});
