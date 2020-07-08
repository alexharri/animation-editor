import { StyleParams } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";

export default ({ css }: StyleParams) => ({
	container: css`
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: ${cssVariables.dark800};
		color: #bbb;
		overflow-y: auto;
	`,

	stack: css`
		display: block;
		position: relative;
		min-height: 16px;

		&:first-of-type {
			margin-top: 24px;
		}
	`,

	stackIcon: css`
		position: absolute;
		left: 16px;
		margin: 0;
		height: 16px;
		width: 16px;
		z-index: 1;

		svg {
			position: absolute;
			left: 0;
			transform: translateY(3px);
			height: 11px;
			width: 11px;
			fill: #999;
		}

		&--undo {
			bottom: 0;
		}

		&--redo {
			top: 0;
		}
	`,

	list: css`
		list-style-type: none;
		margin: 0;
		padding: 0;
	`,

	item: css`
		background: ${cssVariables.gray500};
		font-size: 11px;
		font-weight: 300;
		padding-left: 40px;
		height: 16px;
		line-height: 16px;
		box-sizing: content-box;
		position: relative;
		border-radius: 4px;
		margin: 2px 4px;

		&--redo {
			background: ${cssVariables.dark500};
			color: ${cssVariables.gray800};
		}
	`,

	itemIcon: css`
		width: 13px;
		height: 16px;
		display: inline-block;
		vertical-align: top;
		margin-right: 4px;

		svg {
			width: 13px;
			height: 13px;
			fill: ${cssVariables.light500};
			margin-top: 1px;
		}

		&--redo {
			svg {
				fill: ${cssVariables.gray500};
			}
		}
	`,

	currentItem: css`
		background: ${cssVariables.gray600};
		font-size: 11px;
		padding-left: 40px;
		position: relative;
		border-left: none;
		border-right: none;
		margin: 0 4px;
		border-radius: 4px;
	`,

	savedIndicator: css`
		width: 8px;
		height: 8px;
		position: absolute;
		left: 32px;
		top: 50%;
		background: #999;
		border-radius: 50%;
		transform: translateY(-50%);

		&--active {
			opacity: 1;
			background: red;
		}
	`,
});
