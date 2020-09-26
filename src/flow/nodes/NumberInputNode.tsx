import React from "react";
import { FlowNodeBody } from "~/flow/components/FlowNodeBody";
import { FlowNodeNumberInput } from "~/flow/components/FlowNodeNumberInput";
import { FlowNodeSelect } from "~/flow/components/FlowNodeSelect";
import { FlowNodeTValueInput } from "~/flow/components/FlowNodeTValueInput";
import { flowActions } from "~/flow/flowActions";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeOutput, FlowNodeProps, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
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
	const { areaId, graphId, nodeId, outputs, state, zIndex } = props;

	const { onChange, onChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			params.dispatch(
				flowActions.updateNodeState<FlowNodeType.num_input>(graphId, nodeId, {
					value,
				}),
			);
		},
		onChangeEnd: (_type, params) => {
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
		<FlowNodeBody areaId={areaId} graphId={graphId} nodeId={nodeId} zIndex={zIndex}>
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
		</FlowNodeBody>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ flowState },
	{ graphId, nodeId },
) => {
	const graph = flowState.graphs[graphId];
	const node = graph.nodes[nodeId];
	return {
		outputs: node.outputs,
		state: node.state as StateProps["state"],
	};
};

export const NumberInputNode = connectActionState(mapStateToProps)(NumberInputNodeComponent);
