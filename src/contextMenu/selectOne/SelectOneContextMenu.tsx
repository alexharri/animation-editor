import React from "react";
import {
	CONTEXT_MENU_OPTION_HEIGHT,
	CONTEXT_MENU_OPTION_PADDING_LEFT,
	DEFAULT_CONTEXT_MENU_WIDTH,
} from "~/constants";
import { ContextMenuBaseProps } from "~/contextMenu/contextMenuTypes";
import { cssVariables } from "~/cssVariables";
import { compileStylesheetLabelled, StyleParams } from "~/util/stylesheets";

const styles = ({ css }: StyleParams) => ({
	dropdownContainer: css`
		background: ${cssVariables.dark300};
		border: 1px solid ${cssVariables.gray800};
		min-width: ${DEFAULT_CONTEXT_MENU_WIDTH}px;
		padding: 2px;
		border-radius: 4px;
	`,

	container: css`
		height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		position: relative;

		&:hover {
			background: ${cssVariables.primary500};
		}
	`,

	contentContainer: css`
		height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		display: flex;
		align-items: stretch;
	`,

	activeDot: css`
		position: absolute;
		top: ${CONTEXT_MENU_OPTION_HEIGHT / 2}px;
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: ${cssVariables.white500};
		transform: translate(-50%, -50%);
	`,

	name: css`
		color: ${cssVariables.white500};
		font-size: 12px;
		font-weight: 400;
		line-height: ${CONTEXT_MENU_OPTION_HEIGHT}px;
		font-family: ${cssVariables.fontFamily};
		cursor: default;
	`,
});

const s = compileStylesheetLabelled(styles);

interface OptionProps {
	depth?: number;
	label: string;
	selected: boolean;
	onSelect: () => void;
}

const OptionComponent: React.FC<OptionProps> = (props) => {
	const { depth = 0, label, onSelect, selected } = props;

	const depthLeft = 16 * depth;

	const activeDot = selected && (
		<div
			className={s("activeDot")}
			style={{ left: CONTEXT_MENU_OPTION_PADDING_LEFT / 2 + depthLeft + 4 }}
		/>
	);

	return (
		<div className={s("container")} onClick={onSelect}>
			{activeDot}
			<div
				className={s("contentContainer")}
				style={{ marginLeft: CONTEXT_MENU_OPTION_PADDING_LEFT + depthLeft }}
			>
				<div className={s("name")}>{label}</div>
			</div>
		</div>
	);
};

export interface SelectOneContextMenuProps<T> extends ContextMenuBaseProps {
	options: Array<{
		label: string;
		item: T;
		selected: boolean;
		depth?: number;
	}>;
	onSelect: (item: T) => void;
	updateRect: (rect: Rect) => void;
}

export function SelectOneContextMenu<T>(props: SelectOneContextMenuProps<T>) {
	return (
		<div className={s("dropdownContainer")}>
			{props.options!.map((option, i) => (
				<OptionComponent
					label={option.label}
					onSelect={() => props.onSelect(option.item)}
					selected={option.selected}
					depth={option.depth}
					key={i}
				/>
			))}
		</div>
	);
}
