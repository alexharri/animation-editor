import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	wrapper: css`
		position: relative;
	`,

	bar: css`
		background: ${cssVariables.gray600};
		height: 16px;
		margin-top: 1px;
		margin-bottom: 1px;
	`,
});
