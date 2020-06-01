import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { cssVariables } from "~/cssVariables";
import { NODE_EDITOR_NODE_H_PADDING } from "~/constants";

const s = compileStylesheetLabelled(({ css }) => ({
	container: css`
		height: 20px;
		padding: 1px ${NODE_EDITOR_NODE_H_PADDING}px;
	`,

	select: css`
		height: 18px;
		font-size: 12px;
		font-family: ${cssVariables.fontFamily};
		background: ${cssVariables.dark600};
		width: 100%;
		color: ${cssVariables.light500};
		border-radius: 4px;
		padding: 0 4px;
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
				onMouseDown={(e) => e.stopPropagation()}
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
