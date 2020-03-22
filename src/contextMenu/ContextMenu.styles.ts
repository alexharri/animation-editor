import { StyleParams } from "~/util/stylesheets";
import { cssZIndex, cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	background: css`
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: ${cssZIndex.contextMenuBackground};
		cursor: default;
	`,

	container: css`
		position: fixed;
		top: 0;
		left: 0;
		background: ${cssVariables.dark300};
		border: 1px solid ${cssVariables.gray800};
		width: 180px;
		padding: 2px;
		z-index: ${cssZIndex.contextMenu};
	`,

	name: css`
		color: ${cssVariables.light400};
		padding-left: 32px;
		line-height: 22px;
		font-size: 12px;
		font-family: ${cssVariables.fontFamily};
		cursor: default;
	`,

	separator: css`
		background: ${cssVariables.gray500};
		height: 1px;
		display: block;
		margin: 2px 0;
	`,

	option: css`
		padding: 0;
		padding-left: 32px;
		border: none;
		background: transparent;
		display: block;
		width: 100%;
		height: 22px;
		text-align: left;
		position: relative;
		outline: none;

		&:hover {
			background: ${cssVariables.primary500};
		}
	`,

	option__icon: css`
		position: absolute;
		top: 50%;
		left: 8px;
		width: 14px;
		height: 14px;
		transform: translate(0, -50%);

		svg {
			fill: white;
			width: 14px;
			height: 14px;
		}
	`,

	option__label: css`
		color: white;
		font-size: 12px;
		font-weight: 400;
		line-height: 22px;
		font-family: ${cssVariables.fontFamily};
	`,
});
