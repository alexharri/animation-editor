import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		display: flex;
		padding-left: 24px;
	`,

	label: css`
		color: ${cssVariables.white500};
	`,

	property: css`
		padding-left: 48px;
	`,

	property__label: css`
		color: ${cssVariables.white500};
	`,
});
