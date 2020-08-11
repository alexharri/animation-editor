import React, { useEffect, useRef } from "react";
import { cssVariables } from "~/cssVariables";
import { useActionStateEffect } from "~/hook/useActionState";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { getActionState } from "~/state/stateUtils";
import { store } from "~/state/store";
import { AreaComponentProps } from "~/types/areaTypes";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { renderCompositionWorkspaceGuides, renderWorkspace } from "~/workspace/renderWorkspace";
import WorkspaceStyles from "~/workspace/Workspace.styles";
import { CompositionWorkspaceAreaState } from "~/workspace/workspaceAreaReducer";
import { WorkspaceFooter } from "~/workspace/WorkspaceFooter";
import { workspaceHandlers } from "~/workspace/workspaceHandlers";

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

const s = compileStylesheetLabelled(WorkspaceStyles);

type OwnProps = AreaComponentProps<CompositionWorkspaceAreaState>;
interface StateProps {}
type Props = OwnProps & StateProps;

const WorkspaceComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const guideCanvasRef = useRef<HTMLCanvasElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);
	const zoomTarget = useRef<HTMLDivElement>(null);
	const shouldRenderRef = useRef(true);
	const shouldRenderGuidesRef = useRef(false);
	const propsRef = useRef(props);
	propsRef.current = props;

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

	useActionStateEffect((state, prevState) => {
		if (shouldRenderRef.current) {
			return;
		}

		shouldRenderRef.current = (() => {
			if (state.compositionState !== prevState.compositionState) {
				return true;
			}

			if (state.compositionSelectionState !== prevState.compositionSelectionState) {
				return true;
			}

			return false;
		})();
	});
	useEffect(() => {
		const unsub = store.subscribe(() => {});

		return unsub;
	}, []);

	useEffect(() => {
		let mounted = true;

		const tick = () => {
			if (mounted) {
				requestAnimationFrame(tick);
			}

			const mainCtx = canvasRef.current?.getContext("2d");
			const guidesCtx = guideCanvasRef.current?.getContext("2d");

			if (!mainCtx || !guidesCtx) {
				return;
			}

			const render = shouldRenderRef.current;
			const renderGuides = render || shouldRenderGuidesRef.current;

			if (render) {
				shouldRenderRef.current = false;
				renderWorkspace(getOptions(propsRef.current, mainCtx));
			}

			if (renderGuides) {
				shouldRenderGuidesRef.current = false;
				renderCompositionWorkspaceGuides(
					getOptions(propsRef.current, guidesCtx, mousePositionRef.current),
				);
			}
		};
		tick();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		shouldRenderRef.current = true;
	}, [props]);

	const onMouseMove = (e: React.MouseEvent) => {
		shouldRenderGuidesRef.current = true;

		mousePositionRef.current = Vec2.fromEvent(e);
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
						workspaceHandlers.onMouseDown(e, props.areaId, {
							left,
							top,
							width,
							height,
						}),
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
		</div>
	);
};

export const Workspace = WorkspaceComponent;
