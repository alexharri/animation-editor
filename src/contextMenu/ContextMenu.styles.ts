import { StyleParams } from "~/util/stylesheets";
import { cssZIndex, cssVariables } from "~/cssVariables";
import { DEFAULT_CONTEXT_MENU_WIDTH, CONTEXT_MENU_OPTION_HEIGHT } from "~/constants";

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
		width: ${DEFAULT_CONTEXT_MENU_WIDTH}px;
		padding: 2px;
		border-radius: 4px;
		z-index: ${cssZIndex.contextMenu};
	`,

	name: css`
		color: ${cssVariables.light400};
		padding-left: 32px;
		line-height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
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
		height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		text-align: left;
		position: relative;
		outline: none;
		pointer-events: none;

		&--eligible {
			pointer-events: initial;

			&:hover {
				background: ${cssVariables.primary500};
			}
		}

		&--active {
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
			fill: ${cssVariables.white500};
			width: 14px;
			height: 14px;
		}
	`,

	option__label: css`
		color: ${cssVariables.white500};
		font-size: 12px;
		font-weight: 400;
		line-height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		font-family: ${cssVariables.fontFamily};
		cursor: default;
	`,

	option__arrowRight: css`
		width: 14px;
		height: 14px;
		position: absolute;
		top: 0;
		right: 8px;

		&:before,
		&:after {
			content: "";
			position: absolute;
			top: 0;
			left: 3px;
			right: 3px;
			height: 1px;
			background: ${cssVariables.white500};
		}

		&:before {
			transform: translateY(7.5px) rotate(45deg);
		}

		&:after {
			transform: translateY(12.5px) rotate(-45deg);
		}
	`,
});
