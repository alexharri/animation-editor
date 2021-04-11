import React from "react";
import { FLOW_NODE_H_PADDING_ADDITIONAL } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { ValueType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	container: css`
		height: 20px;
		padding: 2px 0;
	`,

	select: css`
		height: 18px;
		font-size: 12px;
		font-family: ${cssVariables.fontFamily};
		background: ${cssVariables.dark600};
		width: 100%;
		color: ${cssVariables.light500};
		border-radius: 4px;
		padding: 0 ${FLOW_NODE_H_PADDING_ADDITIONAL}px;
		border: none;
		outline: none;
		-webkit-appearance: none;
	`,
}));

interface Props {
	label: string;
	valueType: ValueType;
	nodeId: string;
	outputIndex: number;
}

const valueTypes = [ValueType.Number, ValueType.Vec2];

export const ExpressionNodeOutput: React.FC<Props> = (props) => {
	const { nodeId, outputIndex } = props;

	const onChange = (valueType: ValueType) => {
		console.log(valueType);
		nodeHandlers.onExpressionNodeChangeOutputType(nodeId, outputIndex, valueType);
	};

	return (
		<div className={s("container")}>
			<select
				onChange={(e) => onChange(e.target.value as ValueType)}
				className={s("select")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => e.stopPropagation(),
				})}
				value={props.valueType}
			>
				{valueTypes.map((valueType) => (
					<option key={valueType} value={valueType}>
						{valueType}
					</option>
				))}
			</select>
		</div>
	);
};
