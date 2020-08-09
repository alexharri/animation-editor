import { cssVariables } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		height: 17px;
		padding: 0 24px 0 0;
		margin-left: 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
		background: ${cssVariables.dark600};

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

	graph: css`
		margin-left: 2px;
		height: 16px;
		width: 16px;
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
		width: 80px;
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
});
