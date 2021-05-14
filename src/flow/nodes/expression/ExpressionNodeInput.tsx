import React from "react";
import { FLOW_NODE_H_PADDING_ADDITIONAL, FLOW_NODE_H_PADDING_BASE } from "~/constants";
import { cssVariables } from "~/cssVariables";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { ValueType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { getValueTypeLabel } from "~/value/valueLabels";

const s = compileStylesheetLabelled(({ css }) => ({
	container: css`
		height: 20px;
		padding: 2px ${FLOW_NODE_H_PADDING_BASE}px;
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
	valueType: ValueType;
	value: number;
	nodeId: string;
	inputIndex: number;
}

const valueTypes = [ValueType.Any, ValueType.Number, ValueType.Vec2];

export const ExpressionNodeInput: React.FC<Props> = (props) => {
	const { nodeId, inputIndex } = props;

	const onChange = (valueType: ValueType) => {
		nodeHandlers.onExpressionNodeChangeInputType(nodeId, inputIndex, valueType);
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
						{getValueTypeLabel(valueType)}
					</option>
				))}
			</select>
		</div>
	);
};