import React from "react";
import { NODE_H_PADDING_ADDITIONAL, NODE_H_PADDING_BASE } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	container: css`
		height: 20px;
		padding: 1px ${NODE_H_PADDING_BASE}px;
	`,

	select: css`
		height: 18px;
		font-size: 12px;
		font-family: ${cssVariables.fontFamily};
		background: ${cssVariables.dark600};
		width: 100%;
		color: ${cssVariables.light500};
		border-radius: 4px;
		padding: 0 ${NODE_H_PADDING_ADDITIONAL}px;
		border: none;
		outline: none;
		-webkit-appearance: none;
	`,
}));

interface Option {
	value: string;
	label: string;
	key?: string;
}

interface Props {
	value: string;
	onChange: (value: string) => void;
	options: Option[];
}

export const NodeEditorSelect: React.FC<Props> = (props) => {
	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		props.onChange(value);
	};

	return (
		<div className={s("container")}>
			<select
				onChange={onChange}
				className={s("select")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => e.stopPropagation(),
				})}
				value={props.value}
			>
				{props.options.map((option) => (
					<option key={option.value || option.key} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
};
