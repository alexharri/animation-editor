import { FLOW_NODE_H_PADDING_ADDITIONAL, FLOW_NODE_H_PADDING_BASE } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	input: css`
		min-height: 20px;
		line-height: 20px;
		padding-left: ${FLOW_NODE_H_PADDING_BASE + FLOW_NODE_H_PADDING_ADDITIONAL}px;
		width: 100%;
		position: relative;

		&--noPadding {
			padding-left: 0;
		}
	`,

	input__circle: css`
		position: absolute;
		left: -5px;
		top: 10px;
		transform: translate(0, -50%);
		width: 9px;
		height: 9px;
		background: #b3b223;
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
		padding-right: ${FLOW_NODE_H_PADDING_BASE + FLOW_NODE_H_PADDING_ADDITIONAL}px;
		width: 100%;
		position: relative;
		z-index: 10;

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
		background: #0fa744;
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

	colorInput__colorPickerWrapper: css`
		background: ${cssVariables.dark700};
		border: 1px solid ${cssVariables.gray600};
		padding: 16px;
		border-radius: 4px;
		border-bottom-left-radius: 0;
	`,

	colorInput__colorValue: css`
		margin-left: ${FLOW_NODE_H_PADDING_BASE};
		border: none;
		background: black;
		border-radius: 3px;
		margin-top: 1px;
		height: 14px;
		width: 32px;
	`,
});
