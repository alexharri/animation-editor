import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { NodeEditorNodeInput, NodeEditorNodeOutput } from "~/nodeEditor/nodeEditorIO";
import { expressionNodeHandlers } from "~/nodeEditor/nodes/expression/expressionNodeHandlers";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { ExpressionNodeTextarea } from "~/nodeEditor/nodes/expression/ExpressionNodeTextarea";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
}

type Props = OwnProps & StateProps;

function ExpressionNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs, inputs } = props;

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
			<div style={{ position: "relative" }}>
				<ExpressionNodeTextarea
					nodeId={nodeId}
					graphId={graphId}
					className={s("expressionTextarea")}
				/>
				<div
					className={s("expressionTextarea__resize")}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							expressionNodeHandlers.onTextareaHeightResizeMouseDown(
								e,
								props.areaId,
								props.graphId,
								props.nodeId,
							),
					})}
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
						<div className={s("input__name")}>{input.name}</div>
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
		inputs: node.inputs,
		outputs: node.outputs,
	};
};

export const ExpressionNode = connectActionState(mapStateToProps)(ExpressionNodeComponent);
