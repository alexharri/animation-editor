import { cssVariables } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

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

	compWrapper: css`
		margin: 8px;
	`,
});
