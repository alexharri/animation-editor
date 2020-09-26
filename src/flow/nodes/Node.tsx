import React from "react";
import { FlowNodeBody } from "~/flow/components/FlowNodeBody";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps } from "~/flow/flowTypes";
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
}

type Props = OwnProps & StateProps;

function NodeComponent(props: Props) {
	const { nodeId, areaId, graphId, outputs, inputs, zIndex } = props;

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
						<div className={s("input__name")}>{input.name}</div>
					</div>
				);
			})}
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
		inputs: node.inputs,
		outputs: node.outputs,
	};
};

export const Node = connectActionState(mapStateToProps)(NodeComponent);
