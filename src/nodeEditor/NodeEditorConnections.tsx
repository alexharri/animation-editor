import React from "react";
import { cssVariables, cssZIndex } from "~/cssVariables";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { nodeEditorPositionToViewport } from "~/nodeEditor/nodeEditorUtils";
import {
	calculateNodeInputPosition,
	calculateNodeOutputPosition,
} from "~/nodeEditor/util/calculateNodeHeight";
import { connectActionState } from "~/state/stateUtils";

const COLOR = cssVariables.red500;
const LINE_WIDTH = 1.5;

interface OwnProps {
	graphId: string;
	areaState: NodeEditorAreaState;
	width: number;
	height: number;
	left: number;
	top: number;
}
interface StateProps {
	graph: NodeEditorGraphState;
}
type Props = OwnProps & StateProps;

class NodeEditorConnectionsComponent extends React.Component<Props> {
	public render() {
		const { props } = this;

		const { areaState, graph, width, height, left, top } = props;
		const { pan, scale } = areaState;
		const opts = { viewport: { width, height, left, top }, pan, scale };

		const lines: React.ReactNode[] = [];

		if (graph._dragOutputTo) {
			const { fromOutput, wouldConnectToInput } = graph._dragOutputTo;
			const fromNode = graph.nodes[fromOutput.nodeId];
			const outputIndex = fromOutput.outputIndex;
			const outputPos = nodeEditorPositionToViewport(
				calculateNodeOutputPosition(fromNode, outputIndex),
				opts,
			);

			let position = graph._dragOutputTo.position;

			if (wouldConnectToInput) {
				const targetNode = graph.nodes[wouldConnectToInput.nodeId];
				position = calculateNodeInputPosition(targetNode, wouldConnectToInput.inputIndex);
			}

			const targetPos = nodeEditorPositionToViewport(position, opts);

			lines.push(
				<line
					key="drag-output-to"
					x1={outputPos.x}
					y1={outputPos.y}
					x2={targetPos.x}
					y2={targetPos.y}
					style={{ stroke: COLOR, strokeWidth: LINE_WIDTH * areaState.scale }}
				/>,
			);
		}

		if (graph._dragInputTo) {
			const { fromInput, wouldConnectToOutput } = graph._dragInputTo;
			const inputNode = graph.nodes[fromInput.nodeId];
			const inputIndex = fromInput.inputIndex;
			const inputPos = calculateNodeInputPosition(inputNode, inputIndex).apply((vec) =>
				nodeEditorPositionToViewport(vec, opts),
			);

			let position = graph._dragInputTo.position;

			if (wouldConnectToOutput) {
				const targetNode = graph.nodes[wouldConnectToOutput.nodeId];
				position = calculateNodeOutputPosition(
					targetNode,
					wouldConnectToOutput.outputIndex,
				);
			}

			const targetPos = nodeEditorPositionToViewport(position, opts);

			lines.push(
				<line
					key="drag-output-to"
					x1={inputPos.x}
					y1={inputPos.y}
					x2={targetPos.x}
					y2={targetPos.y}
					style={{ stroke: COLOR, strokeWidth: LINE_WIDTH * areaState.scale }}
				/>,
			);
		}

		const nodeIds = Object.keys(graph.nodes);
		for (let i = 0; i < nodeIds.length; i += 1) {
			const node = graph.nodes[nodeIds[i]];

			for (let j = 0; j < node.inputs.length; j += 1) {
				const pointer = node.inputs[j].pointer;

				if (!pointer) {
					continue;
				}

				const targetNode = graph.nodes[pointer.nodeId];

				const targetPos = calculateNodeOutputPosition(targetNode, pointer.outputIndex)
					.apply((vec) =>
						graph.selection.nodes[targetNode.id]
							? vec.add(props.graph.moveVector)
							: vec,
					)
					.apply((vec) => nodeEditorPositionToViewport(vec, opts));

				const nodePos = calculateNodeInputPosition(node, j)
					.apply((vec) =>
						graph.selection.nodes[node.id] ? vec.add(props.graph.moveVector) : vec,
					)
					.apply((vec) => nodeEditorPositionToViewport(vec, opts));

				lines.push(
					<line
						key={`${node.id}-${j}`}
						x1={nodePos.x}
						y1={nodePos.y}
						x2={targetPos.x}
						y2={targetPos.y}
						style={{
							stroke: COLOR,
							strokeWidth: LINE_WIDTH * areaState.scale,
						}}
					/>,
				);
			}
		}

		return (
			<svg
				width={props.width}
				height={props.height}
				style={{
					zIndex: cssZIndex.nodeEditor.connections,
					position: "absolute",
					top: 0,
					left: 0,
					pointerEvents: "none",
				}}
			>
				{lines}
			</svg>
		);
	}
}

const mapStateToProps: MapActionState<StateProps, OwnProps> = (state, ownProps) => ({
	graph: state.nodeEditor.graphs[ownProps.graphId],
});

export const NodeEditorConnections = connectActionState<StateProps, OwnProps>(mapStateToProps)(
	NodeEditorConnectionsComponent,
);
