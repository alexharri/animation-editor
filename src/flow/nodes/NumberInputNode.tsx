import React from "react";
import { FlowNodeNumberInput } from "~/flow/components/FlowNodeNumberInput";
import { FlowNodeSelect } from "~/flow/components/FlowNodeSelect";
import { FlowNodeTValueInput } from "~/flow/components/FlowNodeTValueInput";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeOutput, FlowNodeProps, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { flowActions } from "~/flow/state/flowActions";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { requestAction } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	outputs: FlowNodeOutput[];
	state: FlowNodeState<FlowNodeType.num_input>;
}

type Props = OwnProps & StateProps;

function NumberInputNodeComponent(props: Props) {
	const { graphId, nodeId, outputs, state } = props;

	const { onChange, onChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			params.dispatch(
				flowActions.updateNodeState<FlowNodeType.num_input>(graphId, nodeId, {
					value,
				}),
			);
			params.performDiff((diff) => diff.flowNodeState(nodeId));
		},
		onChangeEnd: (_type, params) => {
			params.addDiff((diff) => diff.flowNodeState(nodeId));
			params.submitAction("Update number input node value");
		},
	});

	const onTypeChange = (type: string) => {
		requestAction({ history: true }, (params) => {
			params.dispatch(
				flowActions.updateNodeState<FlowNodeType.num_input>(graphId, nodeId, {
					type: type as FlowNodeState<FlowNodeType.num_input>["type"],
				}),
			);
			params.submitAction("Update number input node type");
		});
	};

	return (
		<>
			{outputs.map((output, i) => {
				return (
					<div className={s("output", { last: i === outputs.length - 1 })} key={i}>
						<div
							className={s("output__circle")}
							onMouseDown={(e) =>
								nodeHandlers.onOutputMouseDown(
									e,
									props.areaId,
									props.graphId,
									props.nodeId,
									i,
								)
							}
						/>
						<div className={s("output__name")}>{output.name}</div>
					</div>
				);
			})}
			<FlowNodeSelect
				value={state.type}
				onChange={onTypeChange}
				options={[
					{
						label: "Value",
						value: "value",
					},
					{
						label: "T Value",
						value: "t_value",
					},
				]}
			/>
			{state.type === "t_value" ? (
				<FlowNodeTValueInput
					label="t"
					value={state.value}
					onChange={onChange}
					onChangeEnd={onChangeEnd}
					horizontalPadding
				/>
			) : (
				<FlowNodeNumberInput
					label="Value"
					value={state.value}
					onChange={onChange}
					onChangeEnd={onChangeEnd}
					horizontalPadding
				/>
			)}
		</>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, { nodeId }) => {
	const node = flowState.nodes[nodeId];
	return {
		outputs: node.outputs,
		state: node.state as StateProps["state"],
	};
};

export const NumberInputNode = connectActionState(mapStateToProps)(NumberInputNodeComponent);
