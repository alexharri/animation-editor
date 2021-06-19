import React from "react";
import { FlowNodeProps } from "~/flow/flowTypes";
import { NodeTValueInput } from "~/flow/inputs/NodeTValueInput";
import { NodeVec2Input } from "~/flow/inputs/NodeVec2Input";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";

export function Vec2LerpNode(props: FlowNodeProps) {
	const { areaId, graphId, nodeId, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			<NodeVec2Input {...baseProps} index={0} />
			<NodeVec2Input {...baseProps} index={1} />
			<NodeTValueInput {...baseProps} index={2} />
		</>
	);
}
