import { cssVariables, cssZIndex } from "~/cssVariables";
import { StyleParams } from "~/util/stylesheets";

export default ({ css }: StyleParams) => ({
	container: css`
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		display: flex;
		height: ${cssVariables.toolbarHeight}px;
		background: ${cssVariables.dark500};
		overflow: visible;
		z-index: ${cssZIndex.toolbar};
	`,

	dragArea: css`
		-webkit-app-region: drag;

		&--left {
			min-width: 80px;
		}
		&--right {
			flex-basis: 0;
			flex-grow: 1;
		}
	`,

	list: css`
		display: flex;
	`,

	group: css`
		position: relative;
		height: ${cssVariables.toolbarHeight}px;
		width: 48px;
		min-width: 48px;

		&:last-of-type {
			margin-right: 0;
		}

		&:before {
			content: "";
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			opacity: 0;
			transform: scale(0.9);
			transition: transform 0.2s, opacity 0.1s;
		}

		&:hover {
			&:before {
				opacity: 1;
				transform: scale(1);
				background: ${cssVariables.dark300};
				transition: none;
			}
		}

		&--active {
			&:before {
				opacity: 1;
				transform: scale(1);
				background: ${cssVariables.primary400};
			}

			&:hover:before {
				background: ${cssVariables.primary400};
			}
		}
	`,

	group__visibleTool: css`
		height: ${cssVariables.toolbarHeight};
		width: 32px;
		background: transparent;
		border: none;
		position: relative;
		outline: none;

		svg {
			fill: white;
			width: 16px;
			height: 16px;
			position: absolute;
			top: 12px;
			left: 10px;
		}
	`,

	group__openDropdown: css`
		height: ${cssVariables.toolbarHeight};
		width: 16px;
		border: none;
		background: transparent;
		position: relative;
		vertical-align: top;
		outline: none;

		&:before,
		&:after {
			content: "";
			width: 5px;
			height: 1px;
			background: white;
			position: absolute;
			top: 50%;
			left: 50%;
		}

		&:before {
			transform: translate(-7px, 0) rotate(45deg);
		}

		&:after {
			transform: translate(-5px, 0) rotate(-45deg);
		}

		&:hover {
			&:before {
				transform: translate(-7px, 1px) rotate(45deg);
			}

			&:after {
				transform: translate(-5px, 1px) rotate(-45deg);
			}
		}
	`,

	dropdown: css`
		position: absolute;
		top: 100%;
		left: 0;
		background: ${cssVariables.dark500};
		border: 1px solid ${cssVariables.dark300};
		box-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
	`,

	item: css`
		display: flex;
		align-items: center;
		background: none;
		border: none;
		outline: none;
		font-weight: 300;
		width: 100%;
		padding: 0 10px 0 0;

		&:hover {
			background: ${cssVariables.dark800};
		}
	`,

	icon: css`
		width: 34px;
		height: 40px;
		display: inline-block;
		position: relative;
		padding: 0 9px;
		background: none;
		border: none;
		outline: none;

		svg {
			fill: white;
			width: 16px;
			height: 16px;
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	`,

	label: css`
		font-size: 11px;
		font-family: sans-serif;
		letter-spacing: 0.03em;
		margin-left: 0;
		color: white;
		white-space: nowrap;
		display: inline-block;
		justify-content: space-between;
		display: flex;
		width: 140px;
	`,

	label__key: css``,
});
