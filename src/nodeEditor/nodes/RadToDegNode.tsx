import React from "react";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { NodeNumberInput } from "~/nodeEditor/inputs/NodeNumberInput";
import { NodeEditorNodeInput, NodeEditorNodeOutput } from "~/nodeEditor/nodeEditorIO";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { NodeProps } from "~/nodeEditor/nodes/nodeEditorTypes";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = NodeProps;
interface StateProps {
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
	width: number;
}

type Props = OwnProps & StateProps;

function RadToDegNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs, zIndex } = props;

	const baseProps = { areaId, graphId, nodeId, zIndex };

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
			<NodeNumberInput {...baseProps} index={0} tick={0.1} decimalPlaces={2} />
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

export const RadToDegNode = connectActionState(mapStateToProps)(RadToDegNodeComponent);
