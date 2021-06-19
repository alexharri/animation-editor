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
		padding: 1px ${FLOW_NODE_H_PADDING_BASE}px;
		position: relative;
	`,

	name: css`
		position: absolute;
		top: 1px;
		height: 18px;
		left: ${FLOW_NODE_H_PADDING_BASE + FLOW_NODE_H_PADDING_ADDITIONAL}px;
		line-height: 18px;
		right: ${FLOW_NODE_H_PADDING_BASE + FLOW_NODE_H_PADDING_ADDITIONAL}px;
		white-space: nowrap;
		color: ${cssVariables.white500};
		overflow: hidden;
		text-overflow: ellipsis;
		pointer-events: none;
		font-size: 12px;
		font-family: ${cssVariables.fontFamily};
	`,

	type: css`
		color: ${cssVariables.light500};
	`,

	select: css`
		height: 18px;
		font-size: 12px;
		font-family: ${cssVariables.fontFamily};
		background: ${cssVariables.dark600};
		width: 100%;
		color: transparent;
		border-radius: 4px;
		padding: 0 ${FLOW_NODE_H_PADDING_ADDITIONAL}px;
		border: none;
		outline: none;
		-webkit-appearance: none;
	`,
}));

interface Props {
	name: string;
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
			<div className={s("name")}>
				{props.name}{" "}
				<span className={s("type")}>({getValueTypeLabel(props.valueType)})</span>
			</div>
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
