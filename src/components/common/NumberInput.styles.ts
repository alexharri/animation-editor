import { FLOW_NODE_H_PADDING_ADDITIONAL } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { hexToRGBAString } from "~/util/color/convertColor";
import { StyleParams } from "~/util/stylesheets";

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

		&--flowEditor {
			color: ${cssVariables.white500};
			background-color: ${hexToRGBAString(cssVariables.gray700, 0.4)};
			padding-left: ${FLOW_NODE_H_PADDING_ADDITIONAL}px;
			padding-right: ${FLOW_NODE_H_PADDING_ADDITIONAL}px;

			&:hover {
				background-color: ${hexToRGBAString(cssVariables.gray800, 0.5)};
			}

			&:active {
				background-color: ${hexToRGBAString(cssVariables.gray700, 0.4)};
			}
		}
	`,

	button__label: css`
		flex-grow: 0;
		text-overflow: ellipsis;

		&--flowEditor {
			font-size: 12px;
		}
	`,

	button__value: css`
		flex-grow: 1;
		text-align: right;

		&--flowEditor {
			font-size: 12px;
		}
	`,

	container: css`
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
		line-height: 12px;
		padding: 1px 3px 3px;
		border-radius: 3px;
		font-weight: 400;
		transform: translateY(-1px);

		&::selection {
			color: white;
			background: ${cssVariables.primary700};
		}

		&--flowEditor {
			padding-left: ${FLOW_NODE_H_PADDING_ADDITIONAL}px;
			padding-right: ${FLOW_NODE_H_PADDING_ADDITIONAL}px;
			font-size: 12px;
		}
	`,
});
