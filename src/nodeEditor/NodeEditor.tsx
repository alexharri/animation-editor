import React, { useRef, useState, useEffect } from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { AreaWindowProps } from "~/types/areaTypes";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { nodeEditorHandlers } from "~/nodeEditor/handlers";
import styles from "~/nodeEditor/NodeEditor.styles";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { separateLeftRightMouse } from "~/util/mouse";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorGraphReducer";
import { Node } from "~/nodeEditor/nodes/Node";
import { NodeEditorConnections } from "~/nodeEditor/NodeEditorConnections";
import { transformGlobalToNodeEditorPosition } from "~/nodeEditor/nodeEditorUtils";
import { NodeEditorDragSelect } from "~/nodeEditor/dragSelect/NodeEditorDragSelect";
import { NodePreview } from "~/nodeEditor/nodes/NodePreview";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaWindowProps<NodeEditorAreaState>;
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
	const nodeIds = Object.keys(graph.nodes);

	const [clickCaptureFn, setClickCaptureFn] = useState<{
		fn: ((e: React.MouseEvent) => void) | null;
	}>({ fn: null });
	const [clickCapturePos, setClickCapturePos] = useState<Vec2 | null>(null);

	useEffect(() => {
		const el = clickCaptureTarget.current;
		if (el) {
			console.log(clickCaptureFn.fn ? "block" : "");
			el.style.display = clickCaptureFn.fn ? "block" : "";
		}

		if (clickCaptureFn.fn && el) {
			const moveListener = (e: MouseEvent) => {
				const {
					viewport,
					areaState: { pan, scale },
				} = props;
				const pos = transformGlobalToNodeEditorPosition(
					Vec2.fromEvent(e),
					viewport,
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

	return (
		<>
			<div
				className={s("container")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						nodeEditorHandlers.onLeftClickOutside(
							e,
							props.areaState.graphId,
							props.viewport,
							props.areaState.scale,
							props.areaState.pan,
						);
					},
					right: (e) =>
						nodeEditorHandlers.onRightClickOutside(
							e,
							props.areaState.graphId,
							props.viewport,
							props.areaState.scale,
							props.areaState.pan,
							setClickCaptureFn,
						),
				})}
			>
				<NodeEditorConnections
					areaState={props.areaState}
					graphId={props.areaState.graphId}
					viewport={props.viewport}
				/>
				<div
					style={{
						transform: `translate(${pan.x + props.viewport.width / 2}px, ${
							pan.y + props.viewport.height / 2
						}px)`,
					}}
				>
					<div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
						{nodeIds.map((nodeId) => {
							return (
								<Node
									key={nodeId}
									nodeId={nodeId}
									areaId={props.areaId}
									viewport={props.viewport}
									graphId={props.areaState.graphId}
								/>
							);
						})}

						{clickCapturePos && props.graph._addNodeOfTypeOnClick && (
							<NodePreview
								position={clickCapturePos}
								type={props.graph._addNodeOfTypeOnClick}
								viewport={props.viewport}
							/>
						)}
					</div>
				</div>
			</div>
			<NodeEditorDragSelect
				areaId={props.areaId}
				areaState={props.areaState}
				viewport={props.viewport}
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
					left: (e) => nodeEditorHandlers.onZoomClick(e, props.areaId, props.viewport),
				})}
			/>
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ nodeEditor }, props) => {
	return { graph: nodeEditor.graphs[props.areaState.graphId] };
};

export const NodeEditor = connectActionState(mapStateToProps)(NodeEditorComponent);
