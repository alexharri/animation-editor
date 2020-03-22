import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { GraphEditorNode } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	viewport: Rect;
}
interface StateProps {
	node: GraphEditorNode;
	position: Vec2;
	selected: boolean;
}

type Props = OwnProps & StateProps;

const NodeComponent: React.FC<Props> = props => {
	const { x: left, y: top } = props.position;
	const { selected } = props;

	return (
		<div
			className={s("container", { selected })}
			style={{ left, top }}
			onMouseDown={e =>
				nodeHandlers.mouseDown(e, props.areaId, props.graphId, props.nodeId, props.viewport)
			}
		>
			Node
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const node = graph.nodes[nodeId];
	const selected = !!graph.selection.nodes[nodeId];
	return {
		node: node,
		selected: selected,
		position:
			selected && (graph.moveVector.x !== 0 || graph.moveVector.y !== 0)
				? node.position.add(graph.moveVector)
				: node.position,
	};
};

export const Node = connectActionState(mapStateToProps)(NodeComponent);
