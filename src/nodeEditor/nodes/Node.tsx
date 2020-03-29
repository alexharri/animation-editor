import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import NodeStyles from "~/nodeEditor/nodes/Node.styles";
import { nodeHandlers } from "~/nodeEditor/nodes/nodeHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { NodeEditorNode, nodeEditorOutputsMap } from "~/nodeEditor/nodeEditorInputs";
import { NodeEditorNodeType } from "~/types";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorGraphReducer";

const s = compileStylesheetLabelled(NodeStyles);

interface OwnProps {
	areaId: string;
	graphId: string;
	nodeId: string;
	viewport: Rect;
}
interface StateProps<T extends NodeEditorNodeType> {
	node: NodeEditorNode<T>;
	position: Vec2;
	selected: boolean;
	nodes: NodeEditorGraphState["nodes"];
}

const NodeEditorPointer: React.FC<{ width: number; height: number }> = ({ height, width }) => {
	const flipY = height < 0;
	const flipX = width < 0;

	const transform = `translate(-100%, -100%) ${flipX ? "scaleX(-1)" : ""} ${
		flipY ? "scaleY(-1)" : ""
	}`;

	console.log(transform);

	return (
		<svg
			height={Math.abs(height)}
			width={Math.abs(width)}
			style={{
				transform,
				position: "absolute",
				top: "50%",
				left: 0,
				transformOrigin: "100% 100%",
			}}
		>
			<line
				x1={0}
				y1={0}
				x2={Math.abs(width)}
				y2={Math.abs(height)}
				style={{ stroke: "#ff0000", strokeWidth: 2 }}
			/>
		</svg>
	);
};

type Props<T extends NodeEditorNodeType> = OwnProps & StateProps<T>;

function NodeComponent<T extends NodeEditorNodeType>(_props: Props<T>) {
	const props = _props as Props<NodeEditorNodeType.empty>; // Because of difficult typing

	const { x: left, y: top } = props.position;
	const { selected } = props;

	const outputs = nodeEditorOutputsMap[props.node.type];

	return (
		<div
			className={s("container", { selected })}
			style={{ left, top, width: props.node.width }}
			onMouseDown={separateLeftRightMouse({
				left: e =>
					nodeHandlers.mouseDown(
						e,
						props.areaId,
						props.graphId,
						props.nodeId,
						props.viewport,
					),
				right: e => nodeHandlers.onRightClick(e, props.graphId, props.nodeId),
			})}
		>
			<div className={s("header")}>{props.node.type}</div>
			{outputs.map((output, i) => {
				return (
					<div className={s("output", { last: i === outputs.length - 1 })}>
						<div className={s("output__circle")} />
						<div className={s("output__name")}>{output.name}</div>
					</div>
				);
			})}
			{props.node.inputs.map((input, i) => {
				const pointer = props.node.inputPointers[i];

				return (
					<>
						<div className={s("input")} key={i}>
							<div className={s("input__circle")} />
							<div className={s("input__name")}>{input.name}</div>
							{/* {pointer &&
								(() => {
									// const targetPos = targetNode.position.add(props.mo);
									const targetNode = props.nodes[pointer.nodeId];
									const width =
										props.node.position.x -
										targetNode.position.x -
										targetNode.width;

									const targetY =
										targetNode.position.y + pointer.outputIndex * 20 + 8 + 28;
									const selfY =
										props.node.position.y +
										outputs.length * 20 +
										i * 20 +
										8 +
										8 +
										28;

									const height = selfY - targetY;

									return <NodeEditorPointer width={width} height={height} />;
								})()} */}
						</div>
					</>
				);
			})}
		</div>
	);
}

const mapStateToProps: MapActionState<StateProps<any>, OwnProps> = (
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
		moveVector: graph.moveVector,
		nodes: nodeEditor.graphs[graphId].nodes,
	};
};

export const Node = connectActionState(mapStateToProps)(NodeComponent);
