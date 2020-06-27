import React, { useRef, useState, useEffect } from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { AreaComponentProps } from "~/types/areaTypes";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { nodeEditorHandlers } from "~/nodeEditor/nodeEditorHandlers";
import styles from "~/nodeEditor/NodeEditor.styles";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { separateLeftRightMouse } from "~/util/mouse";
import { Node } from "~/nodeEditor/nodes/Node";
import { ExpressionNode } from "~/nodeEditor/nodes/expression/ExpressionNode";
import { NumberInputNode } from "~/nodeEditor/nodes/NumberInputNode";
import { NodeEditorConnections } from "~/nodeEditor/NodeEditorConnections";
import { transformGlobalToNodeEditorPosition } from "~/nodeEditor/nodeEditorUtils";
import { NodeEditorDragSelect } from "~/nodeEditor/dragSelect/NodeEditorDragSelect";
import { NodePreview } from "~/nodeEditor/nodes/NodePreview";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNodeType } from "~/types";
import { Vec2LerpNode } from "~/nodeEditor/nodes/Vec2LerpNode";
import { Vec2InputNode } from "~/nodeEditor/nodes/Vec2InputNode";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaComponentProps<NodeEditorAreaState>;
interface StateProps {
	graph: NodeEditorGraphState;
}
type Props = OwnProps & StateProps;

const NodeEditorComponent: React.FC<Props> = (props) => {
	const clickCaptureTarget = useRef<HTMLDivElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);
	const zoomTarget = useRef<HTMLDivElement>(null);

	const pan = props.areaState.pan;
	const scale = props.areaState.scale;

	useKeyDownEffect("Space", (down) => {
		if (panTarget.current) {
			panTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Z", (down) => {
		if (zoomTarget.current) {
			zoomTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Alt", (down) => {
		if (zoomTarget.current) {
			zoomTarget.current.style.cursor = down ? "zoom-out" : "zoom-in";
		}
	});

	const { graph } = props;

	const [clickCaptureFn, setClickCaptureFn] = useState<{
		fn: ((e: React.MouseEvent) => void) | null;
	}>({ fn: null });
	const [clickCapturePos, setClickCapturePos] = useState<Vec2 | null>(null);

	useEffect(() => {
		const el = clickCaptureTarget.current;
		if (el) {
			el.style.display = clickCaptureFn.fn ? "block" : "";
		}

		if (clickCaptureFn.fn && el) {
			const moveListener = (e: MouseEvent) => {
				const {
					areaState: { pan, scale },
				} = props;
				const pos = transformGlobalToNodeEditorPosition(
					Vec2.fromEvent(e),
					props,
					scale,
					pan,
				);
				setClickCapturePos(pos);
			};

			el.addEventListener("mousemove", moveListener);
			return () => {
				setClickCapturePos(null);
				el.removeEventListener("mousemove", moveListener);
			};
		}

		return () => {};
	}, [clickCaptureFn.fn]);

	if (!graph) {
		return null;
	}

	const nodeIds = Object.keys(graph.nodes);

	return (
		<>
			<div
				className={s("container")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						nodeEditorHandlers.onLeftClickOutside(
							e,
							props.areaState.graphId,
							props.areaId,
							props.areaState.scale,
							props.areaState.pan,
						);
					},
					right: (e) =>
						nodeEditorHandlers.onRightClickOutside(
							e,
							props.areaState.graphId,
							props.areaId,
							setClickCaptureFn,
						),
				})}
			>
				<NodeEditorConnections
					areaState={props.areaState}
					graphId={props.areaState.graphId}
					height={props.height}
					width={props.width}
					left={props.left}
					top={props.top}
				/>
				<div
					style={{
						transform: `translate(${pan.x + props.width / 2}px, ${
							pan.y + props.height / 2
						}px)`,
					}}
				>
					<div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
						{nodeIds.map((nodeId) => {
							let NodeComponent: React.ComponentType<{
								areaId: string;
								graphId: string;
								nodeId: string;
							}> = Node;

							switch (props.graph.nodes[nodeId].type) {
								case NodeEditorNodeType.expr: {
									NodeComponent = ExpressionNode;
									break;
								}

								case NodeEditorNodeType.num_input: {
									NodeComponent = NumberInputNode;
									break;
								}

								case NodeEditorNodeType.vec2_lerp: {
									NodeComponent = Vec2LerpNode;
									break;
								}

								case NodeEditorNodeType.vec2_input: {
									NodeComponent = Vec2InputNode;
									break;
								}
							}

							return (
								<NodeComponent
									key={nodeId}
									nodeId={nodeId}
									areaId={props.areaId}
									graphId={props.areaState.graphId}
								/>
							);
						})}

						{clickCapturePos && props.graph._addNodeOfTypeOnClick && (
							<NodePreview
								position={clickCapturePos}
								type={props.graph._addNodeOfTypeOnClick.type}
								io={props.graph._addNodeOfTypeOnClick.io}
							/>
						)}
					</div>
				</div>
			</div>
			<NodeEditorDragSelect
				areaId={props.areaId}
				areaState={props.areaState}
				width={props.width}
				height={props.height}
				left={props.left}
				top={props.top}
			/>
			<div
				className={s("clickCaptureTarget")}
				ref={clickCaptureTarget}
				onMouseDown={clickCaptureFn.fn || undefined}
			/>
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => nodeEditorHandlers.onPanStart(props.areaId, e),
				})}
			/>
			<div
				className={s("zoomTarget")}
				ref={zoomTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => nodeEditorHandlers.onZoomClick(e, props.areaId),
				})}
			/>
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ nodeEditor }, props) => {
	return { graph: nodeEditor.graphs[props.areaState.graphId] };
};

export const NodeEditor = connectActionState(mapStateToProps)(NodeEditorComponent);
