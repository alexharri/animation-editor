import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPropertyManager } from "~/composition/manager/property/propertyManager";
import { propertyManagerDiffHandler } from "~/composition/manager/property/propertyManagerDiffHandler";
import { cssCursors, cssZIndex } from "~/cssVariables";
import { FlowNodeBody } from "~/flow/components/FlowNodeBody";
import { FlowEditorDragSelect } from "~/flow/dragSelect/FlowEditorDragSelect";
import styles from "~/flow/FlowEditor.styles";
import { FlowEditorConnections } from "~/flow/FlowEditorConnections";
import { flowEditorHandlers } from "~/flow/flowEditorHandlers";
import { getFlowNodeComponent } from "~/flow/flowNodeComponents";
import { FlowGraph, FlowNode } from "~/flow/flowTypes";
import { flowEditorGlobalToNormal } from "~/flow/flowUtils";
import { NodePreview } from "~/flow/nodes/NodePreview";
import { FlowAreaState } from "~/flow/state/flowAreaReducer";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { subscribeToDiffs, unsubscribeToDiffs } from "~/listener/diffListener";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { CompositionError, CompositionErrorType } from "~/types";
import { AreaComponentProps } from "~/types/areaTypes";
import { isArrayShallowEqual } from "~/util/arrayUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaComponentProps<FlowAreaState>;
interface StateProps {
	graph: FlowGraph;
	nodes: Record<string, FlowNode>;
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

	const nodeIds = graph.nodes;

	const compositionId = useMemo(() => {
		const actionState = getActionState();
		let compositionId: string;

		switch (graph.type) {
			case "layer_graph":
				compositionId = actionState.compositionState.layers[graph.layerId].compositionId;
				break;
			case "array_modifier_graph":
				compositionId =
					actionState.compositionState.properties[graph.propertyId].compositionId;
				break;
			default:
				throw new Error(`Unexpected graph type '${graph.type}'.`);
		}
		return compositionId;
	}, []);

	const propertyManager = useMemo(() => {
		return createPropertyManager(compositionId, getActionState());
	}, []);

	const [errors, setErrors] = useState(() => propertyManager.getErrors());
	const errorsRef = useRef(errors);
	errorsRef.current = errors;

	useEffect(() => {
		let prevState = getActionState();

		const token = subscribeToDiffs((actionState, diffs, direction) => {
			propertyManagerDiffHandler(
				compositionId,
				propertyManager,
				actionState,
				diffs,
				direction,
				prevState,
			);
			prevState = actionState;

			const nextErrors = propertyManager.getErrors();
			if (!isArrayShallowEqual(nextErrors, errorsRef.current)) {
				setErrors(nextErrors);
			}
		});

		return () => {
			unsubscribeToDiffs(token);
		};
	}, []);

	const errorsByNodeId = useMemo(() => {
		const map: Partial<Record<string, CompositionError[]>> = {};
		for (const error of errors) {
			if (error.type !== CompositionErrorType.FlowNode) {
				continue;
			}
			const { nodeId } = error;
			if (!map[nodeId]) {
				map[nodeId] = [];
			}
			map[nodeId]!.push(error);
		}
		return map;
	}, [errors]);

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
							const NodeComponent = getFlowNodeComponent(props.nodes[nodeId].type);
							return (
								<FlowNodeBody
									scale={scale}
									key={nodeId}
									nodeId={nodeId}
									areaId={props.areaId}
									graphId={props.areaState.graphId}
									errors={errorsByNodeId[nodeId] || []}
									zIndex={i}
								>
									<NodeComponent
										nodeId={nodeId}
										areaId={props.areaId}
										graphId={props.areaState.graphId}
										zIndex={i}
									/>
								</FlowNodeBody>
							);
						})}

						{clickCapturePos && props.graph._addNodeOfTypeOnClick && (
							<NodePreview
								position={clickCapturePos}
								type={props.graph._addNodeOfTypeOnClick.type}
								io={props.graph._addNodeOfTypeOnClick.io}
								scale={scale}
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
	return {
		graph: flowState.graphs[props.areaState.graphId],
		nodes: flowState.nodes,
	};
};

export const FlowEditor = connectActionState(mapStateToProps)(FlowEditorComponent);
