import { StyleParams } from "~/util/stylesheets";
import { cssVariables, cssMixins } from "~/cssVariables";
import { NODE_EDITOR_NODE_H_PADDING } from "~/constants";

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
		min-height: 20px;
		line-height: 20px;
		padding-left: ${NODE_EDITOR_NODE_H_PADDING}px;
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
		padding-right: ${NODE_EDITOR_NODE_H_PADDING}px;
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

	widthResize: css`
		position: absolute;
		top: 0;
		right: -1px;
		bottom: 0;
		width: 2px;
		cursor: ew-resize;
	`,

	expressionTextarea: css`
		border: 1px solid ${cssVariables.gray700};
		border-radius: 2px;
		background: ${cssVariables.dark500};
		width: calc(100% - 16px);
		max-width: calc(100% - 16px);
		margin: 0 8px 8px;
		color: white;
		font-size: 13px;
		font-family: monospace;
		resize: none;
		outline: none;

		${cssMixins.darkScrollbar}

		&:focus {
			border-color: ${cssVariables.primary500};
		}
	`,

	expressionTextarea__resize: css`
		position: absolute;
		left: 0;
		right: 0;
		bottom: 7px; /* Because of margin-bottom: 8; */
		height: 2px;
		cursor: ns-resize;
	`,
});
