import React from "react";
import { FlowNodeProps } from "~/flow/flowTypes";
import { NodeNumberInput } from "~/flow/inputs/NodeNumberInput";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";

export function DegToRadNode(props: FlowNodeProps) {
	const { areaId, graphId, nodeId, zIndex } = props;
	const baseProps = { areaId, graphId, nodeId, zIndex };
	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			<NodeNumberInput {...baseProps} index={0} />
		</>
	);
}
