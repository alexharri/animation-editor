import React from "react";
import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNodeOutput, FlowNodeProps, FlowNodeType } from "~/flow/flowTypes";
import NodeStyles from "~/flow/nodes/Node.styles";
import { nodeHandlers } from "~/flow/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = FlowNodeProps;
interface StateProps {
	outputs: FlowNodeOutput[];
	state: FlowNodeState<FlowNodeType.array_modifier_index>;
	layerId: string;
}

type Props = OwnProps & StateProps;

function ArrayModifierIndexNodeComponent(props: Props) {
	const { outputs } = props;

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
		</>
	);
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ flowState },
	{ graphId, nodeId },
) => {
	const graph = flowState.graphs[graphId];
	const node = flowState.nodes[nodeId];
	return {
		outputs: node.outputs,
		state: node.state as StateProps["state"],
		layerId: graph.layerId,
	};
};

export const ArrayModifierIndexNode = connectActionState(mapStateToProps)(
	ArrayModifierIndexNodeComponent,
);
