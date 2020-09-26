import React from "react";
import { DEFAULT_NODE_EDITOR_NODE_WIDTH } from "~/constants";
import { getFlowNodeDefaultInputs, getFlowNodeDefaultOutputs } from "~/flow/flowIO";
import { FlowNodeIO, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	type: FlowNodeType;
	io?: FlowNodeIO;
	position: Vec2;
}

type Props = OwnProps;

export function NodePreview(props: Props) {
	const { io } = props;
	const { x: left, y: top } = props.position;

	const type = props.type as FlowNodeType.empty;

	const inputs = io?.inputs || getFlowNodeDefaultInputs(type);
	const outputs = io?.outputs || getFlowNodeDefaultOutputs(type);

	return (
		<div
			className={s("container")}
			style={{ left, top, width: DEFAULT_NODE_EDITOR_NODE_WIDTH, opacity: 0.5 }}
		>
			<div className={s("header")}>{type}</div>
			{outputs.map((output, i) => {
				return (
					<div key={i} className={s("output", { last: i === outputs.length - 1 })}>
						<div className={s("output__circle")} />
						<div className={s("output__name")}>{output.name}</div>
					</div>
				);
			})}
			{inputs.map((input, i) => {
				return (
					<div key={i} className={s("input")}>
						<div className={s("input__circle")} />
						<div className={s("input__name")}>{input.name}</div>
					</div>
				);
			})}
		</div>
	);
}
