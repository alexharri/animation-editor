import React, { useEffect, useRef } from "react";
import CompWorkspaceStyles from "~/composition/workspace/CompWorkspace.styles";
import { CompositionWorkspaceAreaState } from "~/composition/workspace/compWorkspaceAreaReducer";
import { CompWorkspaceFooter } from "~/composition/workspace/CompWorkspaceFooter";
import { compWorkspaceHandlers } from "~/composition/workspace/compWorkspaceHandlers";
import {
	renderCompositionWorkspaceGuides,
	renderCompWorkspace,
} from "~/composition/workspace/renderCompositionWorkspace";
import { cssVariables } from "~/cssVariables";
import { useActionStateEffect } from "~/hook/useActionState";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { getActionState } from "~/state/stateUtils";
import { store } from "~/state/store";
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
interface StateProps {}
type Props = OwnProps & StateProps;

const CompWorkspaceComponent: React.FC<Props> = (props) => {
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

		const listener = (e: WheelEvent) => compWorkspaceHandlers.onWheel(e, props.areaId);

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
				renderCompWorkspace(getOptions(propsRef.current, mainCtx));
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
			<CompWorkspaceFooter compositionId={props.areaState.compositionId} />
		</div>
	);
};

// const mapStateToProps: MapActionState<StateProps, OwnProps> = ({
// 	compositionState,
// 	compositionSelectionState,
// }) => ({
// 	compositionState,
// 	compositionSelectionState,
// });

// export const CompWorkspace = connectActionState(mapStateToProps)(CompWorkspaceComponent);
export const CompWorkspace = CompWorkspaceComponent;
