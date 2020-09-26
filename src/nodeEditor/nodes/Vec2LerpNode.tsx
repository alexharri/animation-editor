import React from "react";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { NodeTValueInput } from "~/nodeEditor/inputs/NodeTValueInput";
import { NodeVec2Input } from "~/nodeEditor/inputs/NodeVec2Input";
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

function Vec2LerpNodeComponent(props: Props) {
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
			<NodeVec2Input {...baseProps} index={0} />
			<NodeVec2Input {...baseProps} index={1} />
			<NodeTValueInput {...baseProps} index={2} />
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

export const Vec2LerpNode = connectActionState(mapStateToProps)(Vec2LerpNodeComponent);
