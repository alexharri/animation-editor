import React from "react";
import { FlowNodeInput, FlowNodeProps } from "~/flow/flowTypes";
import { NodeNumberInput } from "~/flow/inputs/NodeNumberInput";
import { NodeTValueInput } from "~/flow/inputs/NodeTValueInput";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";
import { connectActionState } from "~/state/stateUtils";

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
	width: number;
}

type Props = OwnProps & StateProps;

function NumberLerpNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			<NodeNumberInput {...baseProps} index={0} />
			<NodeNumberInput {...baseProps} index={1} />
			<NodeTValueInput {...baseProps} index={2} />
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

export const NumberLerpNode = connectActionState(mapStateToProps)(NumberLerpNodeComponent);
