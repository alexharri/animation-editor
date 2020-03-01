import React, { useRef } from "react";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { AreaWindowProps } from "~/types/areaTypes";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { nodeEditorHandlers } from "~/nodeEditor/handlers";
import styles from "~/nodeEditor/NodeEditor.styles";
import { useKeyDownEffect } from "~/hook/useKeyDown";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaWindowProps<NodeEditorAreaState>;
type Props = OwnProps;

const NodeEditorComponent: React.FC<Props> = props => {
	const panTarget = useRef<HTMLDivElement>(null);
	const zoomTarget = useRef<HTMLDivElement>(null);

	const pan = props.areaState.pan;
	const scale = props.areaState.scale;

	useKeyDownEffect("Space", down => {
		if (panTarget.current) {
			panTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Z", down => {
		if (zoomTarget.current) {
			zoomTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Alt", down => {
		if (zoomTarget.current) {
			zoomTarget.current.style.cursor = down ? "zoom-out" : "zoom-in";
		}
	});

	return (
		<>
			<div
				style={{
					transform: `translate(${pan.x + props.viewport.width / 2}px, ${pan.y +
						props.viewport.height / 2}px)`,
				}}
			>
				<div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
					<div style={{ background: "red", height: 50, width: 50 }}>Hello</div>
				</div>
			</div>
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={e => nodeEditorHandlers.onPanStart(props.areaId, e)}
			/>
			<div
				className={s("zoomTarget")}
				ref={zoomTarget}
				onMouseDown={e => nodeEditorHandlers.onZoomClick(e, props.areaId, props.viewport)}
			/>
		</>
	);
};

export const NodeEditor = connectActionState(() => ({}))(NodeEditorComponent);
