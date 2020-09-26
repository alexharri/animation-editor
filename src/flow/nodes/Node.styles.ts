import { FLOW_NODE_H_PADDING_ADDITIONAL, FLOW_NODE_H_PADDING_BASE } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { hexToRGBAString } from "~/util/color/convertColor";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		border: 1px solid ${cssVariables.light200};
		border-radius: 4px;
		padding: 28px 0 16px;
		width: 128px;
		position: absolute;
		background: ${hexToRGBAString(cssVariables.dark800, 0.8)};
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
		cursor: default;

		&--selected {
			border: 1px solid white;
			background: ${hexToRGBAString(cssVariables.gray500, 0.8)};
		}
	`,

	header: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 20px;
		line-height: 20px;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
		color: ${cssVariables.white500};
		background: rgba(255, 255, 255, 0.05);
		padding-left: ${FLOW_NODE_H_PADDING_BASE + FLOW_NODE_H_PADDING_ADDITIONAL}px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow-x: hidden;

		&--selected {
			background: rgba(255, 255, 255, 0.2);
		}
	`,

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

	widthResize: css`
		position: absolute;
		top: 0;
		right: -2px;
		bottom: 0;
		width: 4px;
		cursor: ew-resize;
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
