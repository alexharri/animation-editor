import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { NodeEditorNodeInput, NodeEditorNodeOutput } from "~/nodeEditor/nodeEditorIO";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { NodeNumberInput } from "~/nodeEditor/inputs/NodeNumberInput";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
	width: number;
}

type Props = OwnProps & StateProps;

function Vec2InputNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs } = props;

	const baseProps = { areaId, graphId, nodeId };

	return (
		<NodeBody {...baseProps}>
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
		inputs: node.inputs,
		outputs: node.outputs,
		width: node.width,
	};
};

export const Vec2InputNode = connectActionState(mapStateToProps)(Vec2InputNodeComponent);
