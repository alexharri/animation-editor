import React from "react";
import { FlowNodeBody } from "~/flow/components/FlowNodeBody";
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
	const { areaId, graphId, nodeId, outputs, inputs, zIndex } = props;

	return (
		<FlowNodeBody
			areaId={areaId}
			graphId={graphId}
			nodeId={nodeId}
			allowResize={false}
			zIndex={zIndex}
		>
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
						<ExpressionNodeOutput
							nodeId={nodeId}
							label={output.name}
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
					<div className={s("input")} key={i}>
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
							label={input.name}
							nodeId={nodeId}
							value={input.value}
							valueType={input.type}
						/>
					</div>
				);
			})}
		</FlowNodeBody>
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
