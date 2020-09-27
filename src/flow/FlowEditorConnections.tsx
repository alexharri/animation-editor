import React from "react";
import { cssVariables, cssZIndex } from "~/cssVariables";
import { FlowGraph } from "~/flow/flowTypes";
import { flowEditorPositionToViewport, flowSelectionFromState } from "~/flow/flowUtils";
import { FlowAreaState } from "~/flow/state/flowAreaReducer";
import { FlowGraphSelection } from "~/flow/state/flowSelectionReducer";
import {
	calculateNodeInputPosition,
	calculateNodeOutputPosition,
} from "~/flow/util/flowNodeHeight";
import { connectActionState } from "~/state/stateUtils";

const COLOR = cssVariables.red500;
const LINE_WIDTH = 1.5;

interface OwnProps {
	graphId: string;
	areaState: FlowAreaState;
	width: number;
	height: number;
	left: number;
	top: number;
}
interface StateProps {
	graph: FlowGraph;
	selection: FlowGraphSelection;
}
type Props = OwnProps & StateProps;

class FlowEditorConnectionsComponent extends React.Component<Props> {
	public render() {
		const { props } = this;

		const { areaState, graph, selection, width, height, left, top } = props;
		const { pan, scale } = areaState;
		const opts = { viewport: { width, height, left, top }, pan, scale };

		const lines: React.ReactNode[] = [];

		if (graph._dragOutputTo) {
			const { fromOutput, wouldConnectToInput } = graph._dragOutputTo;
			const fromNode = graph.nodes[fromOutput.nodeId];
			const outputIndex = fromOutput.outputIndex;
			const outputPos = flowEditorPositionToViewport(
				calculateNodeOutputPosition(fromNode, outputIndex),
				opts,
			);

			let position = graph._dragOutputTo.position;

			if (wouldConnectToInput) {
				const targetNode = graph.nodes[wouldConnectToInput.nodeId];
				position = calculateNodeInputPosition(targetNode, wouldConnectToInput.inputIndex);
			}

			const targetPos = flowEditorPositionToViewport(position, opts);

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
				flowEditorPositionToViewport(vec, opts),
			);

			let position = graph._dragInputTo.position;

			if (wouldConnectToOutput) {
				const targetNode = graph.nodes[wouldConnectToOutput.nodeId];
				position = calculateNodeOutputPosition(
					targetNode,
					wouldConnectToOutput.outputIndex,
				);
			}

			const targetPos = flowEditorPositionToViewport(position, opts);

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
						selection.nodes[targetNode.id] ? vec.add(props.graph.moveVector) : vec,
					)
					.apply((vec) => flowEditorPositionToViewport(vec, opts));

				const nodePos = calculateNodeInputPosition(node, j)
					.apply((vec) =>
						selection.nodes[node.id] ? vec.add(props.graph.moveVector) : vec,
					)
					.apply((vec) => flowEditorPositionToViewport(vec, opts));

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
					zIndex: cssZIndex.flowEditor.connections,
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

const mapStateToProps: MapActionState<StateProps, OwnProps> = (state, ownProps) => {
	const graph = state.flowState.graphs[ownProps.graphId];
	const selection = flowSelectionFromState(ownProps.graphId, state.flowSelectionState);
	return {
		graph,
		selection,
	};
};

export const FlowEditorConnections = connectActionState<StateProps, OwnProps>(mapStateToProps)(
	FlowEditorConnectionsComponent,
);
