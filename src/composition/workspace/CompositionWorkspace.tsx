import React, { useRef } from "react";
import { AreaWindowProps } from "~/types/areaTypes";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compositionWorkspaceAreaReducer";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/composition/workspace/CompositionWorkspace.styles";
import { compositionWorkspaceHandlers } from "~/composition/workspace/compositionWorkspaceHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { CompositionWorkspaceViewport } from "~/composition/workspace/CompositionWorkspaceViewport";

const s = compileStylesheetLabelled(styles);

type Props = AreaWindowProps<CompositionWorkspaceAreaState>;

export const CompositionWorkspace: React.FC<Props> = (props) => {
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

	return (
		<div className={s("container")}>
			<div
				style={{
					transform: `translate(${pan.x + props.viewport.width / 2}px, ${
						pan.y + props.viewport.height / 2
					}px)`,
				}}
			>
				<div style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}>
					<CompositionWorkspaceViewport compositionId={props.areaState.compositionId} />
				</div>
			</div>
			<div className={s("clickCaptureTarget")} ref={clickCaptureTarget} />
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => compositionWorkspaceHandlers.onPanStart(e, props.areaId),
				})}
			/>
			<div
				className={s("zoomTarget")}
				ref={zoomTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						compositionWorkspaceHandlers.onZoomClick(e, props.areaId, props.viewport),
				})}
			/>
		</div>
	);
};
