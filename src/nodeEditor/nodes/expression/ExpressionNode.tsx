import React from "react";
import { NodeBody } from "~/nodeEditor/components/NodeBody";
import { NodeEditorNodeInput, NodeEditorNodeOutput } from "~/nodeEditor/nodeEditorIO";
import { ExpressionNodeTextarea } from "~/nodeEditor/nodes/expression/ExpressionNodeTextarea";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { NodeProps } from "~/nodeEditor/nodes/nodeEditorTypes";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

type OwnProps = NodeProps;
interface StateProps {
	inputs: NodeEditorNodeInput[];
	outputs: NodeEditorNodeOutput[];
	nodeWidth: number;
}

type Props = OwnProps & StateProps;

function ExpressionNodeComponent(props: Props) {
	const { areaId, graphId, nodeId, outputs, inputs, zIndex } = props;

	return (
		<NodeBody
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
						<div className={s("output__name")}>{output.name}</div>
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
		nodeWidth: node.width,
	};
};

export const ExpressionNode = connectActionState(mapStateToProps)(ExpressionNodeComponent);
