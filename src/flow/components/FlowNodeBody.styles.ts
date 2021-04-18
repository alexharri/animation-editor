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

		&--hasError {
			border: 1px solid red;
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

	widthResize: css`
		position: absolute;
		top: 0;
		right: -2px;
		bottom: 0;
		width: 4px;
		cursor: ew-resize;
	`,

	error: css`
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		background: ${cssVariables.dark800};
		border: 1px solid red;
		color: ${cssVariables.light500};
		width: 320px;
		transform-origin: 0 0;
		padding: 4px 6px;
		border-radius: 0 4px 4px 4px;
	`,
});
