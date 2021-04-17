import React from "react";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps } from "~/flow/flowTypes";
import { NodeNumberInput } from "~/flow/inputs/NodeNumberInput";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	inputs: FlowNodeInput[];
	outputs: FlowNodeOutput[];
	width: number;
}

type Props = OwnProps & StateProps;

function Vec2InputNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

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
			<NodeNumberInput {...baseProps} index={0} />
			<NodeNumberInput {...baseProps} index={1} />
		</>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, { nodeId }) => {
	const node = flowState.nodes[nodeId];
	return {
		inputs: node.inputs,
		outputs: node.outputs,
		width: node.width,
	};
};

export const Vec2InputNode = connectActionState(mapStateToProps)(Vec2InputNodeComponent);
