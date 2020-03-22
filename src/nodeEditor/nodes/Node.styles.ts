import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		border: 1px solid red;
		padding: 8px;
		width: 64px;
		height: 64px;
		position: absolute;
		cursor: default;

		&--selected {
			border: 1px solid cyan;
		}
	`,
});
