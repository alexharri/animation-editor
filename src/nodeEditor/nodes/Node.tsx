import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
}
interface StateProps {
	node: NodeEditorNode<any>;
	position: Vec2;
	selected: boolean;
	nodes: NodeEditorGraphState["nodes"];
}

type Props = OwnProps & StateProps;

function NodeComponent(props: Props) {
	const { x: left, y: top } = props.position;
	const { selected } = props;

	return (
		<div
			className={s("container", { selected })}
			style={{ left, top, width: props.node.width }}
			onMouseDown={separateLeftRightMouse({
				left: (e) => nodeHandlers.mouseDown(e, props.areaId, props.graphId, props.nodeId),
				right: (e) => nodeHandlers.onRightClick(e, props.graphId, props.nodeId),
			})}
		>
			<div className={s("header")}>
				{props.node.type} ({props.node.id})
			</div>
			{props.node.outputs.map((output, i) => {
				return (
					<div
						className={s("output", { last: i === props.node.outputs.length - 1 })}
						key={i}
					>
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
			{props.node.inputs.map((input, i) => {
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
}

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
		nodes: nodeEditor.graphs[graphId].nodes,
	};
};

export const Node = connectActionState(mapStateToProps)(NodeComponent);
