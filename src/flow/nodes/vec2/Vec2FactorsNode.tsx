import React from "react";
import { FlowNodeInput, FlowNodeProps } from "~/flow/flowTypes";
import { NodeVec2Input } from "~/flow/inputs/NodeVec2Input";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";
import { connectActionState } from "~/state/stateUtils";

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
	width: number;
}

type Props = OwnProps & StateProps;

function Vec2FactorsNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			<NodeVec2Input {...baseProps} index={0} />
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

export const Vec2FactorsNode = connectActionState(mapStateToProps)(Vec2FactorsNodeComponent);
