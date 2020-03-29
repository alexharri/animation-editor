import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		border: 1px solid red;
		padding: 28px 0 16px;
		width: 128px;
		position: absolute;
		background: ${cssVariables.gray500};
		cursor: default;

		&--selected {
			border: 1px solid white;
		}
	`,

	header: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 20px;
		line-height: 20px;
		color: ${cssVariables.white500};
		background: ${cssVariables.gray700};
		padding-left: 16px;
	`,

	input: css`
		height: 20px;
		line-height: 20px;
		padding-left: 16px;
		width: 100%;
		position: relative;
	`,

	input__circle: css`
		position: absolute;
		left: -5px;
		top: 50%;
		transform: translate(0, -50%);
		width: 9px;
		height: 9px;
		background: yellow;
		border-radius: 50%;
	`,

	input__name: css`
		font-family: ${cssVariables.fontFamily};
		white-space: nowrap;
		color: ${cssVariables.white500};
		overflow: hidden;
		text-overflow: ellipsis;
	`,

	output: css`
		height: 20px;
		line-height: 20px;
		padding-right: 16px;
		width: 100%;
		position: relative;

		&--last {
			margin-bottom: 8px;
		}
	`,

	output__circle: css`
		position: absolute;
		right: -5px;
		top: 50%;
		transform: translate(0, -50%);
		width: 9px;
		height: 9px;
		background: green;
		border-radius: 50%;
	`,

	output__name: css`
		font-family: ${cssVariables.fontFamily};
		white-space: nowrap;
		color: ${cssVariables.white500};
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: right;
	`,
});
