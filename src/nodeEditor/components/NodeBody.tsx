import React from "react";
import { getNodeEditorNodeLabel } from "~/nodeEditor/nodeEditorUtils";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { connectActionState } from "~/state/stateUtils";
import { NodeEditorNodeType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	zIndex: number;
	allowResize?: boolean;
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

const NodeBodyComponent: React.FC<Props> = (props) => {
	const { top, left, width, type, allowResize = true, zIndex } = props;
	const { selected } = props;

	return (
		<div
			className={s("container", { selected })}
			style={{ left, top, width, zIndex }}
			onMouseDown={separateLeftRightMouse({
				left: (e) => nodeHandlers.mouseDown(e, props.areaId, props.graphId, props.nodeId),
				right: (e) => nodeHandlers.onRightClick(e, props.graphId, props.nodeId),
			})}
		>
			<div className={s("header", { selected })}>{getNodeEditorNodeLabel(type)}</div>
			{props.children}
			{allowResize && (
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
			)}
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
