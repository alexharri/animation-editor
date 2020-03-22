import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	canvas: css`
		background: ${cssVariables.dark700};
	`,
});
