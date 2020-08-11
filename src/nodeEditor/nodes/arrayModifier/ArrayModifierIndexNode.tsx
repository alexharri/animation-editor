import React from "react";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { NodeEditorNodeOutput, NodeEditorNodeState } from "~/nodeEditor/nodeEditorIO";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { NodeEditorNodeType } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	outputs: NodeEditorNodeOutput[];
	state: NodeEditorNodeState<NodeEditorNodeType.array_modifier_index>;
	layerId: string;
}

type Props = OwnProps & StateProps;

function ArrayModifierIndexNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs } = props;

	return (
		<NodeBody areaId={areaId} graphId={graphId} nodeId={nodeId}>
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
		layerId: graph.layerId,
	};
};

export const ArrayModifierIndexNode = connectActionState(mapStateToProps)(
	ArrayModifierIndexNodeComponent,
);
