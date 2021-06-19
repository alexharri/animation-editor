import React from "react";
import { FlowNodeVec2Input } from "~/flow/components/FlowNodeVec2Input";
import { FlowNodeInput } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { NodeInputCircle } from "~/flow/nodes/NodeInputCircle";
import { flowActions } from "~/flow/state/flowActions";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	index: number;
}
interface StateProps {
	input: FlowNodeInput;
}
type Props = OwnProps & StateProps;

const NodeVec2InputComponent: React.FC<Props> = (props) => {
	const { graphId, nodeId, index, input } = props;

	const vec = props.input.value;

	const { onChange: onXChange, onChangeEnd: onXChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			const newVec = Vec2.new(value, vec.y);
			params.dispatch(flowActions.setNodeInputValue(graphId, nodeId, index, newVec));
			params.performDiff((diff) => diff.flowNodeState(nodeId));
		},
		onChangeEnd: (_type, params) => {
			params.addDiff((diff) => diff.flowNodeState(nodeId));
			params.submitAction("Update X value");
		},
	});

	const { onChange: onYChange, onChangeEnd: onYChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			const newVec = Vec2.new(vec.x, value);
			params.dispatch(flowActions.setNodeInputValue(graphId, nodeId, index, newVec));
			params.performDiff((diff) => diff.flowNodeState(nodeId));
		},
		onChangeEnd: (_type, params) => {
			params.addDiff((diff) => diff.flowNodeState(nodeId));
			params.submitAction("Update Y value");
		},
	});

	return (
		<>
			<div className={s("input")}>
				<NodeInputCircle nodeId={nodeId} valueType={input.type} index={index} />
				<div className={s("input__name")}>{input.name}</div>
			</div>
			{!input.pointer && (
				<>
					<FlowNodeVec2Input
						onXChange={onXChange}
						onXChangeEnd={onXChangeEnd}
						onYChange={onYChange}
						onYChangeEnd={onYChangeEnd}
						value={input.value}
						paddingRight
					/>
				</>
			)}
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ flowState },
	{ nodeId, index },
) => {
	const node = flowState.nodes[nodeId];
	return {
		input: node.inputs[index],
	};
};

export const NodeVec2Input = connectActionState(mapStateToProps)(NodeVec2InputComponent);
