import React from "react";
import { FlowNodeNumberInput } from "~/flow/components/FlowNodeNumberInput";
import { FlowNodeTValueInput } from "~/flow/components/FlowNodeTValueInput";
import { FlowNodeInput, FlowNodeProps } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { NodeInputCircle } from "~/flow/nodes/NodeInputCircle";
import { NodeOutputs } from "~/flow/nodes/NodeOutputs";
import { flowActions } from "~/flow/state/flowActions";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

const Container: React.FC<{ index: number; nodeId: string; input: FlowNodeInput }> = (props) => {
	const { index, children, input, nodeId } = props;
	return (
		<div className={s("input", { noPadding: !input.pointer })}>
			<NodeInputCircle nodeId={nodeId} valueType={input.type} index={index} />
			{input.pointer ? <div className={s("input__name")}>{input.name}</div> : children}
		</div>
	);
};

const labels = ["H", "S", "L", "A"];

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
}
type Props = OwnProps & StateProps;

const ColorFromHSLNodeComponent: React.FC<Props> = (props) => {
	const { graphId, nodeId } = props;

	const numberInputActions = [0, 1, 2, 3].map((i) => {
		return useNumberInputAction({
			onChange: (value, params) => {
				params.performDiff((diff) => diff.flowNodeState(nodeId));
				params.dispatch(flowActions.setNodeInputValue(graphId, nodeId, i, value));
			},
			onChangeEnd: (_type, params) => {
				params.addDiff((diff) => diff.flowNodeState(nodeId));
				params.submitAction("Update input value");
			},
		});
	});
	const max = [360, 100, 100, 1];

	return (
		<>
			<NodeOutputs nodeId={nodeId} />
			{[0, 1, 2].map((i) => {
				return (
					<Container input={props.inputs[i]} nodeId={nodeId} index={i} key={i}>
						<FlowNodeNumberInput
							label={labels[i]}
							value={props.inputs[i].value}
							onChange={numberInputActions[i].onChange}
							onChangeEnd={numberInputActions[i].onChangeEnd}
							min={0}
							max={max[i]}
							horizontalPadding
							decimalPlaces={0}
						/>
					</Container>
				);
			})}
			<Container input={props.inputs[3]} nodeId={nodeId} index={3}>
				<FlowNodeTValueInput
					label={labels[3]}
					value={props.inputs[3].value}
					onChange={numberInputActions[3].onChange}
					onChangeEnd={numberInputActions[3].onChangeEnd}
					horizontalPadding
				/>
			</Container>
		</>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (state, ownProps) => {
	const node = state.flowState.nodes[ownProps.nodeId];
	return { inputs: node.inputs };
};

export const ColorFromHSLNode = connectActionState(mapState)(ColorFromHSLNodeComponent);
