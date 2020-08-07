import React, { useEffect, useLayoutEffect, useRef } from "react";
import { CompositionState } from "~/composition/state/compositionReducer";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import CompWorkspaceStyles from "~/composition/workspace/CompWorkspace.styles";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compWorkspaceAreaReducer";
import { compWorkspaceHandlers } from "~/composition/workspace/compWorkspaceHandlers";
import {
	renderCompositionWorkspaceGuides,
	renderCompWorkspace,
} from "~/composition/workspace/renderCompositionWorkspace";
import { cssVariables } from "~/cssVariables";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { AreaComponentProps } from "~/types/areaTypes";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const getOptions = (props: Props, ctx: CanvasRenderingContext2D, mousePosition?: Vec2) => {
	const { width, height, left, top } = props;

	const state = getActionState();
	const compositionId = props.areaState.compositionId;
	const { compositionState, compositionSelectionState } = state;

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

	const options = {
		ctx,
		compositionId,
		compositionState,
		compositionSelectionState,
		map,
		pan,
		scale,
		viewport: { width, height, left, top },
		mousePosition,
	};
	return options;
};

const s = compileStylesheetLabelled(CompWorkspaceStyles);

type OwnProps = AreaComponentProps<CompositionWorkspaceAreaState>;
interface StateProps {
	compositionState: CompositionState;
	compositionSelectionState: CompositionSelectionState;
}
type Props = OwnProps & StateProps;

const CompWorkspaceComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const guideCanvasRef = useRef<HTMLCanvasElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);
	const zoomTarget = useRef<HTMLDivElement>(null);

	const mousePositionRef = useRef<Vec2 | undefined>(undefined);

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
		const mainCtx = canvasRef.current?.getContext("2d");
		const guidesCtx = guideCanvasRef.current?.getContext("2d");

		if (!mainCtx || !guidesCtx) {
			return;
		}

		renderCompWorkspace(getOptions(props, mainCtx));
		renderCompositionWorkspaceGuides(getOptions(props, guidesCtx, mousePositionRef.current));
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

	const onMouseMove = (e: React.MouseEvent) => {
		mousePositionRef.current = Vec2.fromEvent(e);

		const guidesCtx = guideCanvasRef.current?.getContext("2d");

		if (!guidesCtx) {
			return;
		}

		renderCompositionWorkspaceGuides(getOptions(props, guidesCtx, mousePositionRef.current));
	};

	const { left, top, width, height } = props;

	return (
		<div
			style={{ background: cssVariables.gray400 }}
			ref={containerRef}
			onMouseMove={onMouseMove}
		>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				style={{ position: "absolute", top: 0, left: 0 }}
			/>
			<canvas
				ref={guideCanvasRef}
				height={height}
				width={width}
				style={{ position: "absolute", top: 0, left: 0 }}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						compWorkspaceHandlers.onMouseDown(e, props.areaId, {
							left,
							top,
							width,
							height,
						}),
					middle: (e) => compWorkspaceHandlers.onPanStart(props.areaId, e),
				})}
			/>
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

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({
	compositionState,
	compositionSelectionState,
}) => ({
	compositionState,
	compositionSelectionState,
});

export const CompWorkspace = connectActionState(mapStateToProps)(CompWorkspaceComponent);
