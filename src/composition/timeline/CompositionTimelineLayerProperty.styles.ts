import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		display: flex;
		height: 17px;
		padding: 0 24px 0 0;
		margin-left: 24px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: ${cssVariables.dark700};
		box-sizing: border-box;
		align-items: stretch;

		&:last-of-type {
			border-bottom: none;
		}
	`,

	name: css`
		width: 80px;
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

	value: css`
		width: 80px;
	`,

	timelineIcon: css`
		width: 16px;
		height: 16px;
		margin-right: 2px;
		padding: 2px;
		cursor: pointer;

		svg {
			fill: #666;
			width: 12px;
			height: 12px;
		}

		&--active {
			svg {
				fill: $color-primary;
			}
		}
	`,
});
