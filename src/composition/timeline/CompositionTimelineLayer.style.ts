import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		display: flex;
		padding-left: 24px;
		background: ${cssVariables.dark700};
		margin-bottom: 1px;
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
});
