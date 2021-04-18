import React from "react";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps } from "~/flow/flowTypes";
import { ExpressionNodeInput } from "~/flow/nodes/expression/ExpressionNodeInput";
import { ExpressionNodeOutput } from "~/flow/nodes/expression/ExpressionNodeOutput";
import { ExpressionNodeTextarea } from "~/flow/nodes/expression/ExpressionNodeTextarea";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
	nodeWidth: number;
}

type Props = OwnProps & StateProps;

function ExpressionNodeComponent(props: Props) {
	const { graphId, nodeId, outputs, inputs } = props;

	return (
		<>
			{outputs.map((output, i) => {
				return (
					<div
						className={s("output", { noPadding: true, last: i === outputs.length - 1 })}
						key={i}
					>
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
						<ExpressionNodeOutput
							nodeId={nodeId}
							outputIndex={i}
							valueType={output.type}
						/>
					</div>
				);
			})}
			<div style={{ position: "relative" }}>
				<ExpressionNodeTextarea
					nodeId={nodeId}
					graphId={graphId}
					nodeWidth={props.nodeWidth}
				/>
			</div>
			{inputs.map((input, i) => {
				return (
					<div className={s("input", { noPadding: true })} key={i}>
						<div
							className={s("input__circle")}
							onMouseDown={separateLeftRightMouse({
								left: input.pointer
									? (e) =>
											nodeHandlers.onInputWithPointerMouseDown(
												e,
												props.areaId,
												props.graphId,
												props.nodeId,
												i,
											)
									: (e) =>
											nodeHandlers.onInputMouseDown(
												e,
												props.areaId,
												props.graphId,
												props.nodeId,
												i,
											),
							})}
						/>
						<ExpressionNodeInput
							inputIndex={i}
							nodeId={nodeId}
							value={input.value}
							valueType={input.type}
						/>
					</div>
				);
			})}
		</>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, { nodeId }) => {
	const node = flowState.nodes[nodeId];
	return {
		inputs: node.inputs,
		outputs: node.outputs,
		nodeWidth: node.width,
	};
};

export const ExpressionNode = connectActionState(mapStateToProps)(ExpressionNodeComponent);
