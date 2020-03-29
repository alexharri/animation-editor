import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorGraphReducer";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { nodeEditorOutputsMap } from "~/nodeEditor/nodeEditorInputs";

interface OwnProps {
	graphId: string;
	viewport: Rect;
	areaState: NodeEditorAreaState;
}
interface StateProps {
	graph: NodeEditorGraphState;
}
type Props = OwnProps & StateProps;

class NodeEditorConnectionsComponent extends React.Component<Props> {
	public render() {
		const { props } = this;

		const { areaState, viewport, graph } = props;

		const lines: React.ReactNode[] = [];

		const nodeIds = Object.keys(graph.nodes);
		for (let i = 0; i < nodeIds.length; i += 1) {
			const node = graph.nodes[nodeIds[i]];

			for (let j = 0; j < node.inputPointers.length; j += 1) {
				const pointer = node.inputPointers[j];

				if (!pointer) {
					continue;
				}

				const targetNode = graph.nodes[pointer.nodeId];
				const outputs = nodeEditorOutputsMap[node.type];

				let nodePos = graph.selection.nodes[node.id]
					? node.position.add(props.graph.moveVector)
					: node.position;
				let targetPos = graph.selection.nodes[targetNode.id]
					? targetNode.position.add(props.graph.moveVector)
					: targetNode.position;

				targetPos = targetPos
					.add(Vec2.new(targetNode.width, 28 + pointer.outputIndex * 20 + 10))
					.scale(areaState.scale)
					.add(areaState.pan)
					.add(Vec2.new(viewport.width / 2, viewport.height / 2));

				nodePos = nodePos
					.add(Vec2.new(0, 28 + outputs.length * 20 + 8 + i * 20 + 11))
					.scale(areaState.scale)
					.add(areaState.pan)
					.add(Vec2.new(viewport.width / 2, viewport.height / 2));

				lines.push(
					<line
						key={`${node.id}-${j}`}
						x1={nodePos.x}
						y1={nodePos.y}
						x2={targetPos.x}
						y2={targetPos.y}
						style={{ stroke: "#ff0000", strokeWidth: 2 * areaState.scale }}
					/>,
				);
			}
		}

		return (
			<svg
				width={viewport.width}
				height={viewport.height}
				style={{ zIndex: 45, position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
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
