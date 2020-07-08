import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	button: css`
		cursor: pointer;
		border: none;
		height: 16px;
		font-family: ${cssVariables.fontFamily};
		font-size: 11px;
		color: ${cssVariables.primary700};
		background-color: transparent;
		transition: background-color 0.3s;
		border-radius: 3px;
		line-height: 16px;
		padding: 0 4px;
		outline: none;
		display: flex;

		&:hover {
			background-color: rgba(255, 255, 255, 0.05);
		}

		&:active {
			background-color: rgba(255, 255, 255, 0.1);
			cursor: ew-resize;
		}

		&--fillWidth {
			width: 100%;
		}

		&--computed {
			color: red;
		}
	`,

	button__label: css`
		flex-grow: 0;
		text-overflow: ellipsis;
	`,

	button__value: css`
		flex-grow: 1;
		text-align: right;
	`,

	container: css`
		width: 50px;
		height: 16px;
		display: inline-block;
		vertical-align: top;

		input {
			width: 50px;
		}

		&--fullWidth {
			width: 100%;

			input {
				width: 100%;
			}
		}
	`,

	input: css`
		height: 18px;
		color: white;
		outline: none;
		background-color: ${cssVariables.dark300};
		border: 1px solid ${cssVariables.primary400};
		font-size: 11px;
		padding: 0 3px;
		padding-top: 1px;
		padding-bottom: 1px;
		border-radius: 3px;
		font-weight: 400;
		transform: translateY(-1px);

		&::selection {
			color: white;
			background: ${cssVariables.primary700};
		}
	`,
});
