import React from "react";
import { useNumberInputAction } from "~/hook/useNumberInputAction";
import { requestAction } from "~/listener/requestAction";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { NodeEditorNumberInput } from "~/nodeEditor/components/NodeEditorNumberInput";
import { NodeEditorSelect } from "~/nodeEditor/components/NodeEditorSelect";
import { NodeEditorTValueInput } from "~/nodeEditor/components/NodeEditorTValueInput";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { NodeEditorNodeOutput, NodeEditorNodeState } from "~/nodeEditor/nodeEditorIO";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { NodeProps } from "~/nodeEditor/nodes/nodeEditorTypes";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { NodeEditorNodeType } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = NodeProps;
interface StateProps {
	outputs: NodeEditorNodeOutput[];
	state: NodeEditorNodeState<NodeEditorNodeType.num_input>;
}

type Props = OwnProps & StateProps;

function NumberInputNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs, state, zIndex } = props;

	const { onChange, onChangeEnd } = useNumberInputAction({
		onChange: (value, params) => {
			params.dispatch(
				nodeEditorActions.updateNodeState<NodeEditorNodeType.num_input>(graphId, nodeId, {
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
				nodeEditorActions.updateNodeState<NodeEditorNodeType.num_input>(graphId, nodeId, {
					type: type as NodeEditorNodeState<NodeEditorNodeType.num_input>["type"],
				}),
			);
			params.submitAction("Update number input node type");
		});
	};

	return (
		<NodeBody areaId={areaId} graphId={graphId} nodeId={nodeId} zIndex={zIndex}>
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
			<NodeEditorSelect
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
				<NodeEditorTValueInput
					label="t"
					value={state.value}
					onChange={onChange}
					onChangeEnd={onChangeEnd}
					horizontalPadding
				/>
			) : (
				<NodeEditorNumberInput
					label="Value"
					value={state.value}
					onChange={onChange}
					onChangeEnd={onChangeEnd}
					horizontalPadding
				/>
			)}
		</NodeBody>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId];
	return {
		outputs: node.outputs,
		state: node.state as StateProps["state"],
	};
};

export const NumberInputNode = connectActionState(mapStateToProps)(NumberInputNodeComponent);
