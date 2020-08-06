import React, { useEffect, useLayoutEffect, useRef } from "react";
import { CompositionState } from "~/composition/state/compositionReducer";
import CompWorkspaceStyles from "~/composition/workspace/CompWorkspace.styles";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compWorkspaceAreaReducer";
import { compWorkspaceHandlers } from "~/composition/workspace/compWorkspaceHandlers";
import { renderCompWorkspace } from "~/composition/workspace/renderCompositionWorkspace";
import { cssVariables } from "~/cssVariables";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { AreaComponentProps } from "~/types/areaTypes";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(CompWorkspaceStyles);

type OwnProps = AreaComponentProps<CompositionWorkspaceAreaState>;
interface StateProps {
	compositionState: CompositionState;
}
type Props = OwnProps & StateProps;

const CompWorkspaceComponent: React.FC<Props> = (props) => {
	const { width, height, left, top } = props;

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);
	const zoomTarget = useRef<HTMLDivElement>(null);

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

	useLayoutEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		const state = getActionState();
		const compositionId = props.areaState.compositionId;
		const { compositionState } = state;

		const composition = compositionState.compositions[compositionId];
		const map = getCompositionRenderValues(
			state,
			composition.id,
			composition.frameIndex,
			{
				width: composition.width,
				height: composition.height,
			},
			{ recursive: true },
		);

		const { pan, scale } = props.areaState;

		renderCompWorkspace({
			ctx,
			compositionId,
			compositionState,
			map,
			pan,
			scale,
			viewport: { width, height, left, top },
		});
	}, [props]);

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const listener = (e: WheelEvent) => compWorkspaceHandlers.onWheel(e, props.areaId);

		const el = containerRef.current;
		el.addEventListener("wheel", listener, { passive: false });

		return () => {
			el.removeEventListener("wheel", listener);
		};
	}, [containerRef.current]);

	return (
		<div style={{ background: cssVariables.gray400 }} ref={containerRef}>
			<canvas ref={canvasRef} height={height} width={width} />
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => compWorkspaceHandlers.onPanStart(props.areaId, e),
				})}
			/>
			<div
				className={s("zoomTarget")}
				ref={zoomTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => compWorkspaceHandlers.onZoomClick(e, props.areaId),
				})}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ compositionState }) => ({
	compositionState,
});

export const CompWorkspaceCanvas = connectActionState(mapStateToProps)(CompWorkspaceComponent);
