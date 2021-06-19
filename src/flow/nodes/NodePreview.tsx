import React, { useContext } from "react";
import { AreaIdContext } from "~/area/util/AreaIdContext";
import { DEFAULT_FLOW_NODE_WIDTH } from "~/constants";
import { FlowNodeBodyComponent } from "~/flow/components/FlowNodeBody";
import { getFlowNodeDefaultInputs, getFlowNodeDefaultOutputs } from "~/flow/flowIO";
import { FlowNodeIO, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	type: FlowNodeType;
	io?: FlowNodeIO;
	position: Vec2;
	scale: number;
}

type Props = OwnProps;

export function NodePreview(props: Props) {
	const { io, scale } = props;
	const { x: left, y: top } = props.position;
	const areaId = useContext(AreaIdContext);

	const type = props.type as FlowNodeType.empty;

	const inputs = io?.inputs || getFlowNodeDefaultInputs(type);
	const outputs = io?.outputs || getFlowNodeDefaultOutputs(type);

	return (
		<FlowNodeBodyComponent
			nodeId="-1"
			areaId={areaId}
			errors={[]}
			graphId={""}
			left={left}
			top={top}
			scale={scale}
			selected
			type={type}
			width={DEFAULT_FLOW_NODE_WIDTH}
			zIndex={999999}
		>
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
		</FlowNodeBodyComponent>
	);
}
