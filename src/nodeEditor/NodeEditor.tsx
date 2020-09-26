import React, { useEffect, useRef, useState } from "react";
import { cssCursors, cssZIndex } from "~/cssVariables";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { NodeEditorDragSelect } from "~/nodeEditor/dragSelect/NodeEditorDragSelect";
import styles from "~/nodeEditor/NodeEditor.styles";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { NodeEditorConnections } from "~/nodeEditor/NodeEditorConnections";
import { nodeEditorHandlers } from "~/nodeEditor/nodeEditorHandlers";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { nodeEditorGlobalToNormal } from "~/nodeEditor/nodeEditorUtils";
import { ArrayModifierIndexNode } from "~/nodeEditor/nodes/arrayModifier/ArrayModifierIndexNode";
import { CapNumberNode } from "~/nodeEditor/nodes/CapNumberNode";
import { ColorInputNode } from "~/nodeEditor/nodes/color/ColorInputNode";
import { DegToRadNode } from "~/nodeEditor/nodes/DegToRadNode";
import { ExpressionNode } from "~/nodeEditor/nodes/expression/ExpressionNode";
import { Node } from "~/nodeEditor/nodes/Node";
import { NodePreview } from "~/nodeEditor/nodes/NodePreview";
import { NumberInputNode } from "~/nodeEditor/nodes/NumberInputNode";
import { PropertyInputNode } from "~/nodeEditor/nodes/property/PropertyInputNode";
import { PropertyOutputNode } from "~/nodeEditor/nodes/property/PropertyOutputNode";
import { RadToDegNode } from "~/nodeEditor/nodes/RadToDegNode";
import { Vec2AddNode } from "~/nodeEditor/nodes/Vec2AddNode";
import { Vec2FactorsNode } from "~/nodeEditor/nodes/Vec2FactorsNode";
import { Vec2InputNode } from "~/nodeEditor/nodes/Vec2InputNode";
import { Vec2LerpNode } from "~/nodeEditor/nodes/Vec2LerpNode";
import { connectActionState } from "~/state/stateUtils";
import { NodeEditorNodeType } from "~/types";
import { AreaComponentProps } from "~/types/areaTypes";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

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
			zoomTarget.current.style.cursor = down
				? cssCursors.zoom.zoomOut
				: cssCursors.zoom.zoomIn;
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
				const pos = nodeEditorGlobalToNormal(Vec2.fromEvent(e), props, scale, pan);
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

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const listener = (e: WheelEvent) => nodeEditorHandlers.onWheel(e, props.areaId);

		const el = containerRef.current;
		el.addEventListener("wheel", listener, { passive: false });

		return () => {
			el.removeEventListener("wheel", listener);
		};
	}, [containerRef.current]);

	if (!graph) {
		console.log(props);
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
					middle: (e) => nodeEditorHandlers.onPanStart(props.areaId, e),
				})}
				ref={containerRef}
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
						position: "relative",
						zIndex: cssZIndex.nodeEditor.nodes,
						transform: `translate(${pan.x + props.width / 2}px, ${
							pan.y + props.height / 2
						}px)`,
					}}
				>
					<div
						style={{
							transform: `scale(${scale})`,
							transformOrigin: "0 0",
						}}
					>
						{nodeIds.map((nodeId, i) => {
							let NodeComponent: React.ComponentType<{
								areaId: string;
								graphId: string;
								nodeId: string;
								zIndex: number;
							}> = Node;

							switch (props.graph.nodes[nodeId].type) {
								case NodeEditorNodeType.expr: {
									NodeComponent = ExpressionNode;
									break;
								}

								case NodeEditorNodeType.property_input: {
									NodeComponent = PropertyInputNode;
									break;
								}

								case NodeEditorNodeType.num_cap: {
									NodeComponent = CapNumberNode;
									break;
								}

								case NodeEditorNodeType.property_output: {
									NodeComponent = PropertyOutputNode;
									break;
								}

								case NodeEditorNodeType.color_input: {
									NodeComponent = ColorInputNode;
									break;
								}

								case NodeEditorNodeType.num_input: {
									NodeComponent = NumberInputNode;
									break;
								}

								case NodeEditorNodeType.deg_to_rad: {
									NodeComponent = DegToRadNode;
									break;
								}

								case NodeEditorNodeType.rad_to_deg: {
									NodeComponent = RadToDegNode;
									break;
								}

								case NodeEditorNodeType.vec2_add: {
									NodeComponent = Vec2AddNode;
									break;
								}

								case NodeEditorNodeType.vec2_lerp: {
									NodeComponent = Vec2LerpNode;
									break;
								}

								case NodeEditorNodeType.vec2_factors: {
									NodeComponent = Vec2FactorsNode;
									break;
								}

								case NodeEditorNodeType.vec2_input: {
									NodeComponent = Vec2InputNode;
									break;
								}

								case NodeEditorNodeType.array_modifier_index:
									NodeComponent = ArrayModifierIndexNode;
									break;
							}

							return (
								<NodeComponent
									key={nodeId}
									nodeId={nodeId}
									areaId={props.areaId}
									graphId={props.areaState.graphId}
									zIndex={i}
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
