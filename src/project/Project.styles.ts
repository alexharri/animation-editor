import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		background: ${cssVariables.dark800};
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	`,

	header: css`
		height: 32px;
		padding-left: 40px;
		background: ${cssVariables.dark600};
		display: flex;
		align-items: center;
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

	compWrapper: css`
		margin: 8px;
	`,
});
