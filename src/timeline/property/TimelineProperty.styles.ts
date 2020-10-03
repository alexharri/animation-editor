import { cssVariables } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		height: 17px;
		padding: 0 24px 0 0;
		margin-left: 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: ${cssVariables.dark600};
		min-width: 320px;

		&:last-of-type {
			height: 16px;
			border-bottom: none;
		}
	`,

	contentContainer: css`
		height: 16px;
		display: flex;
		align-items: stretch;
	`,

	graphWrapper: css`
		margin-left: 2px;
		margin-right: 4px;
		width: 48px;
		display: flex;
	`,

	graph: css`
		height: 16px;
		width: 16px;
		background: transparent;
		border: none;
		position: relative;
		cursor: pointer;

		svg {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 14px;
			height: 14px;
			fill: ${cssVariables.light300};
			transform: translate(-50%, -50%);
		}

		&--active {
			svg {
				fill: ${cssVariables.primary500};
			}
		}
	`,

	openGraphInArea: css`
		margin-left: 2px;
		height: 16px;
		width: 16px;
		position: relative;
		cursor: grab;

		&:active {
			cursor: grabbing;
		}

		svg {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 14px;
			height: 14px;
			fill: ${cssVariables.light300};
			transform: translate(-50%, -50%);
		}

		&--active {
			svg {
				fill: ${cssVariables.primary500};
			}
		}
	`,

	collapsedArrow: css`
		width: 16px;
		height: 16px;
		position: relative;

		&--open {
			transform: translate(0, 0px) rotate(90deg);
		}

		&:before,
		&:after {
			content: "";
			position: absolute;
			top: 7px;
			left: 4px;
			right: 6px;
			height: 1px;
			transform-origin: 100% 50%;
			background: ${cssVariables.light300};
		}

		&:before {
			transform: rotate(45deg);
		}

		&:after {
			transform: rotate(-45deg);
		}
	`,

	name: css`
		width: 128px;
		font-size: 11px;
		color: #bbb;
		line-height: 16px;
		padding: 0 3px;
		border-radius: 3px;
		cursor: default;
		margin-right: 4px;

		&--active {
			background-color: ${cssVariables.gray700};
		}
	`,

	value: css`
		white-space: nowrap;
	`,

	timelineIcon: css`
		width: 16px;
		height: 16px;
		margin-right: 2px;
		padding: 2px;
		cursor: pointer;

		svg {
			fill: #666;
			width: 12px;
			height: 12px;
		}

		&--active {
			svg {
				fill: ${cssVariables.primary500};
			}
		}
	`,

	colorValueButton: css`
		border: none;
		background: black;
		border-radius: 3px;
		margin-top: 1px;
		height: 14px;
		width: 32px;
	`,

	colorPickerWrapper: css`
		background: ${cssVariables.dark700};
		border: 1px solid ${cssVariables.gray600};
		padding: 16px;
		border-radius: 4px;
		border-bottom-left-radius: 0;
	`,

	select: css`
		color: ${cssVariables.light500};
		background-color: ${cssVariables.gray400};
		padding: 0 4px;
		border: none;
		-webkit-appearance: none;
		border-radius: 4px;
		height: 16px;
		line-height: 16px;
		outline: none;
		width: 140px;
		font-size: 11px;
		font-family: ${cssVariables.fontFamily};
	`,

	moveUpDownButton: css`
		border: none;
		background: transparent;
		padding: 2px;
		width: 16px;
		height: 16px;
		outline: none;
		cursor: pointer;

		svg {
			width: 13px;
			height: 13px;
			fill: ${cssVariables.light300};
		}

		&--down {
			svg {
				transform: translateY(-1px) rotate(180deg);
			}
		}
	`,

	maintainProportionsButton: css`
		position: relative;
		border: none;
		background: ${cssVariables.dark500};
		width: 16px;
		height: 14px;
		line-height: 14px;
		padding: 0;
		margin: 0;
		margin-top: 1px;
		margin-right: 2px;
		border-radius: 2px;

		svg {
			fill: ${cssVariables.dark600};
			width: 16px;
			height: 16px;
			position: absolute;
			top: -1px;
			left: 0;
		}

		&--active {
			svg {
				fill: ${cssVariables.light200};
			}
		}
	`,
});
