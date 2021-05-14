import React from "react";
import { FlowNodeInput, FlowNodeProps } from "~/flow/flowTypes";
import { NodeNumberInput } from "~/flow/inputs/NodeNumberInput";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";
import { connectActionState } from "~/state/stateUtils";

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
	width: number;
}

type Props = OwnProps & StateProps;

function RadToDegNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			<NodeNumberInput {...baseProps} index={0} tick={0.1} decimalPlaces={2} />
		</>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, { nodeId }) => {
	const node = flowState.nodes[nodeId];
	return {
		inputs: node.inputs,
		width: node.width,
	};
};

export const RadToDegNode = connectActionState(mapStateToProps)(RadToDegNodeComponent);
