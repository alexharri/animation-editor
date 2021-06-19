import React from "react";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps } from "~/flow/flowTypes";
import { NodeNumberInput } from "~/flow/inputs/NodeNumberInput";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";
import { connectActionState } from "~/state/stateUtils";

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
	width: number;
}

type Props = OwnProps & StateProps;

function CapNumberNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			<NodeNumberInput {...baseProps} index={0} />
			<NodeNumberInput {...baseProps} index={1} />
			<NodeNumberInput {...baseProps} index={2} />
		</>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, { nodeId }) => {
	const node = flowState.nodes[nodeId];
	return {
		inputs: node.inputs,
		outputs: node.outputs,
		width: node.width,
	};
};

export const CapNumberNode = connectActionState(mapStateToProps)(CapNumberNodeComponent);
