import { cssVariables } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		height: 16px;
		padding: 0 16px;
		margin-bottom: 2px;
		background: ${cssVariables.gray500};
		border-radius: 4px;
		display: flex;
	`,

	openInArea: css`
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
