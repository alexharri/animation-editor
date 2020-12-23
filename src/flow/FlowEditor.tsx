import React, { useEffect, useRef, useState } from "react";
import { cssCursors, cssZIndex } from "~/cssVariables";
import { FlowEditorDragSelect } from "~/flow/dragSelect/FlowEditorDragSelect";
import styles from "~/flow/FlowEditor.styles";
import { FlowEditorConnections } from "~/flow/FlowEditorConnections";
import { flowEditorHandlers } from "~/flow/flowEditorHandlers";
import { FlowGraph, FlowNodeType } from "~/flow/flowTypes";
import { flowEditorGlobalToNormal } from "~/flow/flowUtils";
import { ArrayModifierIndexNode } from "~/flow/nodes/arrayModifier/ArrayModifierIndexNode";
import { CapNumberNode } from "~/flow/nodes/CapNumberNode";
import { ColorInputNode } from "~/flow/nodes/color/ColorInputNode";
import { DegToRadNode } from "~/flow/nodes/DegToRadNode";
import { ExpressionNode } from "~/flow/nodes/expression/ExpressionNode";
import { Node } from "~/flow/nodes/Node";
import { NodePreview } from "~/flow/nodes/NodePreview";
import { NumberInputNode } from "~/flow/nodes/NumberInputNode";
import { NumberLerpNode } from "~/flow/nodes/NumberLerpNode";
import { PropertyInputNode } from "~/flow/nodes/property/PropertyInputNode";
import { PropertyOutputNode } from "~/flow/nodes/property/PropertyOutputNode";
import { RadToDegNode } from "~/flow/nodes/RadToDegNode";
import { Vec2AddNode } from "~/flow/nodes/vec2/Vec2AddNode";
import { Vec2FactorsNode } from "~/flow/nodes/vec2/Vec2FactorsNode";
import { Vec2InputNode } from "~/flow/nodes/vec2/Vec2InputNode";
import { Vec2LerpNode } from "~/flow/nodes/vec2/Vec2LerpNode";
import { FlowAreaState } from "~/flow/state/flowAreaReducer";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { connectActionState } from "~/state/stateUtils";
import { AreaComponentProps } from "~/types/areaTypes";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaComponentProps<FlowAreaState>;
interface StateProps {
	graph: FlowGraph;
}
type Props = OwnProps & StateProps;

const FlowEditorComponent: React.FC<Props> = (props) => {
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
				const pos = flowEditorGlobalToNormal(Vec2.fromEvent(e), props, scale, pan);
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

		const listener = (e: WheelEvent) => flowEditorHandlers.onWheel(e, props.areaId);

		const el = containerRef.current;
		el.addEventListener("wheel", listener, { passive: false });

		return () => {
			el.removeEventListener("wheel", listener);
		};
	}, [containerRef.current]);

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
						flowEditorHandlers.onLeftClickOutside(
							e,
							props.areaState.graphId,
							props.areaId,
							props.areaState.scale,
							props.areaState.pan,
						);
					},
					right: (e) =>
						flowEditorHandlers.onRightClickOutside(
							e,
							props.areaState.graphId,
							props.areaId,
							setClickCaptureFn,
						),
					middle: (e) => flowEditorHandlers.onPanStart(props.areaId, e),
				})}
				ref={containerRef}
			>
				<FlowEditorConnections
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
						zIndex: cssZIndex.flowEditor.nodes,
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
								case FlowNodeType.expr: {
									NodeComponent = ExpressionNode;
									break;
								}

								case FlowNodeType.num_lerp: {
									NodeComponent = NumberLerpNode;
									break;
								}

								case FlowNodeType.property_input: {
									NodeComponent = PropertyInputNode;
									break;
								}

								case FlowNodeType.num_cap: {
									NodeComponent = CapNumberNode;
									break;
								}

								case FlowNodeType.property_output: {
									NodeComponent = PropertyOutputNode;
									break;
								}

								case FlowNodeType.color_input: {
									NodeComponent = ColorInputNode;
									break;
								}

								case FlowNodeType.num_input: {
									NodeComponent = NumberInputNode;
									break;
								}

								case FlowNodeType.deg_to_rad: {
									NodeComponent = DegToRadNode;
									break;
								}

								case FlowNodeType.rad_to_deg: {
									NodeComponent = RadToDegNode;
									break;
								}

								case FlowNodeType.vec2_add: {
									NodeComponent = Vec2AddNode;
									break;
								}

								case FlowNodeType.vec2_lerp: {
									NodeComponent = Vec2LerpNode;
									break;
								}

								case FlowNodeType.vec2_factors: {
									NodeComponent = Vec2FactorsNode;
									break;
								}

								case FlowNodeType.vec2_input: {
									NodeComponent = Vec2InputNode;
									break;
								}

								case FlowNodeType.array_modifier_index:
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
			<FlowEditorDragSelect
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
					left: (e) => flowEditorHandlers.onPanStart(props.areaId, e),
				})}
			/>
			<div
				className={s("zoomTarget")}
				ref={zoomTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => flowEditorHandlers.onZoomClick(e, props.areaId),
				})}
			/>
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ flowState }, props) => {
	return { graph: flowState.graphs[props.areaState.graphId] };
};

export const FlowEditor = connectActionState(mapStateToProps)(FlowEditorComponent);
