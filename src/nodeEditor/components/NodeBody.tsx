import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { separateLeftRightMouse } from "~/util/mouse";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { NodeEditorNodeType } from "~/types";
import { connectActionState } from "~/state/stateUtils";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	children: React.ReactNode;
}
interface StateProps {
	type: NodeEditorNodeType;
	left: number;
	top: number;
	width: number;
	selected: boolean;
}
type Props = OwnProps & StateProps;

export const NodeBodyComponent: React.FC<Props> = (props) => {
	const { top, left, width, type, nodeId } = props;
	const { selected } = props;

	return (
		<div
			className={s("container", { selected })}
			style={{ left, top, width }}
			onMouseDown={separateLeftRightMouse({
				left: (e) => nodeHandlers.mouseDown(e, props.areaId, props.graphId, props.nodeId),
				right: (e) => nodeHandlers.onRightClick(e, props.graphId, props.nodeId),
			})}
		>
			<div className={s("header")}>
				{type} ({nodeId})
			</div>
			{props.children}
			<div
				className={s("widthResize")}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						nodeHandlers.onWidthResizeMouseDown(
							e,
							props.areaId,
							props.graphId,
							props.nodeId,
						),
				})}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ nodeEditor },
	{ graphId, nodeId },
) => {
	const graph = nodeEditor.graphs[graphId];
	const { type, width, position } = graph.nodes[nodeId];
	const selected = !!graph.selection.nodes[nodeId];
	const { x: left, y: top } =
		selected && (graph.moveVector.x !== 0 || graph.moveVector.y !== 0)
			? position.add(graph.moveVector)
			: position;
	return { selected, left, top, type, width };
};

export const NodeBody = connectActionState(mapStateToProps)(NodeBodyComponent);
