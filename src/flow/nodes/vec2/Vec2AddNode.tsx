import React from "react";
import { FlowNodeBody } from "~/flow/components/FlowNodeBody";
import { FlowNodeInput, FlowNodeOutput, FlowNodeProps } from "~/flow/flowTypes";
import { NodeVec2Input } from "~/flow/inputs/NodeVec2Input";
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

function Vec2AddNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

	return (
		<FlowNodeBody {...baseProps}>
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
			<NodeVec2Input {...baseProps} index={0} />
			<NodeVec2Input {...baseProps} index={1} />
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
		width: node.width,
	};
};

export const Vec2AddNode = connectActionState(mapStateToProps)(Vec2AddNodeComponent);
