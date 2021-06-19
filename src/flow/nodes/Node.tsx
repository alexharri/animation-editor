import React from "react";
import { FlowNodeInput, FlowNodeProps } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { NodeInputCircle } from "~/flow/nodes/NodeInputCircle";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
}

type Props = OwnProps & StateProps;

function NodeComponent(props: Props) {
	const { nodeId, inputs } = props;

	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			{inputs.map((input, index) => {
				return (
					<div className={s("input")} key={index}>
						<NodeInputCircle nodeId={nodeId} valueType={input.type} index={index} />
						<div className={s("input__name")}>{input.name}</div>
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
	};
};

export const Node = connectActionState(mapStateToProps)(NodeComponent);
