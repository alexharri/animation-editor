import React from "react";
import { FlowNodeTValueInput } from "~/flow/components/FlowNodeTValueInput";
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

const NodeTValueInputComponent: React.FC<Props> = (props) => {
	const { graphId, nodeId, index, input } = props;

	const { onChange, onChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			params.performDiff((diff) => diff.flowNodeState(nodeId));
			params.dispatch(flowActions.setNodeInputValue(graphId, nodeId, index, value));
		},
		onChangeEnd: (_type, params) => {
			params.addDiff((diff) => diff.flowNodeState(nodeId));
			params.submitAction("Update input value");
		},
	});

	return (
		<div className={s("input", { noPadding: !input.pointer })}>
			<NodeInputCircle nodeId={nodeId} valueType={input.type} index={index} />
			{input.pointer ? (
				<div className={s("input__name")}>{input.name}</div>
			) : (
				<FlowNodeTValueInput
					label={input.name}
					onChange={onChange}
					onChangeEnd={onChangeEnd}
					value={input.value}
					paddingRight
					paddingLeft
				/>
			)}
		</div>
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

export const NodeTValueInput = connectActionState(mapStateToProps)(NodeTValueInputComponent);
