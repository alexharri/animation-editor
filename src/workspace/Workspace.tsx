import React, { useEffect, useRef, useState } from "react";
import { useCompositionPlayback } from "~/composition/compositionPlayback";
import { manageTopLevelComposition } from "~/composition/manager/compositionManager";
import { Tool } from "~/constants";
import { cssCursors, cssVariables } from "~/cssVariables";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { getActionState } from "~/state/stateUtils";
import { AreaComponentProps } from "~/types/areaTypes";
import { isArrayShallowEqual } from "~/util/arrayUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { moveToolHandlers } from "~/workspace/moveTool/moveTool";
import { penToolHandlers } from "~/workspace/penTool/penTool";
import { useWorkspaceCursor } from "~/workspace/useWorkspaceCursor";
import WorkspaceStyles from "~/workspace/Workspace.styles";
import { WorkspaceAreaState } from "~/workspace/workspaceAreaReducer";
import { WorkspaceFooter } from "~/workspace/WorkspaceFooter";
import { workspaceHandlers } from "~/workspace/workspaceHandlers";

const s = compileStylesheetLabelled(WorkspaceStyles);

type OwnProps = AreaComponentProps<WorkspaceAreaState>;
interface StateProps {}
type Props = OwnProps & StateProps;

const WorkspaceComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);
	const zoomTarget = useRef<HTMLDivElement>(null);
	const propsRef = useRef(props);
	propsRef.current = props;

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

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const listener = (e: WheelEvent) => workspaceHandlers.onWheel(e, props.areaId);

		const el = containerRef.current;
		el.addEventListener("wheel", listener, { passive: false });

		return () => {
			el.removeEventListener("wheel", listener);
		};
	}, [containerRef.current]);

	const [errors, setErrors] = useState<string[]>([]);
	const errorsRef = useRef(errors);
	errorsRef.current = errors;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const unsubscribe = manageTopLevelComposition(
			props.areaState.compositionId,
			props.areaId,
			canvas,
			(nextErrors) => {
				console.log(nextErrors);
				const errorMessages = nextErrors.map((error) => error.message);
				if (isArrayShallowEqual(errorsRef.current, errorMessages)) {
					return;
				}
				setErrors(errorMessages);
			},
		);
		return unsubscribe;
	}, []);

	useCompositionPlayback(props.areaState.compositionId, propsRef);

	const { left, top, width, height } = props;

	const setCursor = useWorkspaceCursor(canvasRef, {
		compositionId: props.areaState.compositionId,
		viewport: { width, left, top, height },
		areaId: props.areaId,
	});

	const onMouseMove = (e: React.MouseEvent) => {
		setCursor(e);
	};
	const onMouseOut = (e: React.MouseEvent) => {
		setCursor(e);
	};

	const onMouseDown = (e: React.MouseEvent) => {
		const { tool } = getActionState();

		const viewport = { left, top, width, height };

		switch (tool.selected) {
			case Tool.pen: {
				penToolHandlers.onMouseDown(e, props.areaId, viewport);
				break;
			}
			default: {
				moveToolHandlers.onMouseDown(e, props.areaId, viewport);
			}
		}
	};

	return (
		<div
			style={{ background: cssVariables.gray400 }}
			ref={containerRef}
			onMouseMove={onMouseMove}
			onMouseOut={onMouseOut}
		>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				style={{ position: "absolute", top: 0, left: 0 }}
				onMouseDown={separateLeftRightMouse({
					left: onMouseDown,
					middle: (e) => workspaceHandlers.onPanStart(props.areaId, e),
				})}
			/>
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => workspaceHandlers.onPanStart(props.areaId, e),
				})}
			/>
			<div
				className={s("zoomTarget")}
				ref={zoomTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => workspaceHandlers.onZoomClick(e, props.areaId),
				})}
			/>
			<WorkspaceFooter compositionId={props.areaState.compositionId} />
			{errors.length > 0 && (
				<div className={s("errors")}>
					{errors.length > 1 && <>1/{errors.length}:&nbsp;</>}
					{errors[0]}
				</div>
			)}
		</div>
	);
};

export const PixiWorkspace = WorkspaceComponent;
