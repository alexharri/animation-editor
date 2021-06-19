import React from "react";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps } from "~/flow/flowTypes";
import { ExpressionNodeInput } from "~/flow/nodes/expression/ExpressionNodeInput";
import { ExpressionNodeOutput } from "~/flow/nodes/expression/ExpressionNodeOutput";
import { ExpressionNodeTextarea } from "~/flow/nodes/expression/ExpressionNodeTextarea";
import NodeStyles from "~/flow/nodes/Node.styles";
import { NodeInputCircle } from "~/flow/nodes/NodeInputCircle";
import { NodeOutputCircle } from "~/flow/nodes/NodeOutputCircle";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
	nodeWidth: number;
}

type Props = OwnProps & StateProps;

function ExpressionNodeComponent(props: Props) {
	const { graphId, nodeId, outputs, inputs } = props;

	return (
		<>
			{outputs.map((output, i) => {
				return (
					<div
						className={s("output", { noPadding: true, last: i === outputs.length - 1 })}
						key={i}
					>
						<NodeOutputCircle nodeId={nodeId} index={i} valueType={output.type} />
						<ExpressionNodeOutput
							nodeId={nodeId}
							name={output.name}
							outputIndex={i}
							valueType={output.type}
						/>
					</div>
				);
			})}
			<div style={{ position: "relative" }}>
				<ExpressionNodeTextarea
					nodeId={nodeId}
					graphId={graphId}
					nodeWidth={props.nodeWidth}
				/>
			</div>
			{inputs.map((input, index) => {
				return (
					<div className={s("input", { noPadding: true })} key={index}>
						<NodeInputCircle nodeId={nodeId} valueType={input.type} index={index} />
						<ExpressionNodeInput
							inputIndex={index}
							nodeId={nodeId}
							name={input.name}
							value={input.value}
							valueType={input.type}
						/>
					</div>
				);
			})}
		</>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, { nodeId }) => {
	const node = flowState.nodes[nodeId];
	return {
		inputs: node.inputs,
		outputs: node.outputs,
		nodeWidth: node.width,
	};
};

export const ExpressionNode = connectActionState(mapStateToProps)(ExpressionNodeComponent);
