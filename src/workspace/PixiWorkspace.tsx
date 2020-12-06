import * as PIXI from "pixi.js";
import React, { useCallback, useEffect, useRef } from "react";
import { getCompositionPlayback, useCompositionPlayback } from "~/composition/compositionPlayback";
import { Tool } from "~/constants";
import { cssCursors, cssVariables } from "~/cssVariables";
import { useActionStateEffect } from "~/hook/useActionState";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { manageComposition } from "~/render/pixi/compositionManager";
import { renderCompositionWorkspaceGuides as renderWorkspaceGuides } from "~/render/renderWorkspace";
import { getCompositionRenderValues } from "~/shared/composition/compositionRenderValues";
import { getActionId, getActionState } from "~/state/stateUtils";
import { AreaComponentProps } from "~/types/areaTypes";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { moveToolHandlers } from "~/workspace/moveTool/moveTool";
import { penToolHandlers } from "~/workspace/penTool/penTool";
import { useWorkspaceCursor } from "~/workspace/useWorkspaceCursor";
import WorkspaceStyles from "~/workspace/Workspace.styles";
import { CompositionWorkspaceAreaState } from "~/workspace/workspaceAreaReducer";
import { WorkspaceFooter } from "~/workspace/WorkspaceFooter";
import { workspaceHandlers } from "~/workspace/workspaceHandlers";

const getOptions = (
	props: Props,
	ctx: CanvasRenderingContext2D,
	mousePosition: Vec2 | undefined,
	keyDown: { Shift: boolean; Command: boolean },
	frameIndex?: number,
) => {
	const { width, height, left, top } = props;

	const state = getActionState();
	const isPerformingAction = !!getActionId();
	const compositionId = props.areaState.compositionId;
	const {
		compositionState,
		compositionSelectionState,
		shapeState,
		shapeSelectionState,
		tool: toolState,
	} = state;

	const composition = compositionState.compositions[compositionId];
	const map = getCompositionRenderValues(
		state,
		composition.id,
		frameIndex ?? composition.frameIndex,
		{
			width: composition.width,
			height: composition.height,
		},
		{ recursive: true },
	);

	const { pan, scale, selectionRect } = props.areaState;

	const options = {
		ctx,
		compositionId,
		compositionState,
		compositionSelectionState,
		shapeState,
		shapeSelectionState,
		map,
		pan,
		scale,
		viewport: { width, height, left, top },
		mousePosition,
		selectionRect,
		tool: toolState.selected,
		isPerformingAction,
		keyDown,
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

	const appRef = useRef<PIXI.Application | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) {
			return;
		}

		const unsubscribe = manageComposition(props.areaState.compositionId, props.areaId, canvas);
		return unsubscribe;
	}, []);

	// useEffect(() => {
	// 	const canvas = canvasRef.current;
	// 	if (!canvas) {
	// 		return;
	// 	}
	// 	const app = new PIXI.Application({
	// 		width: canvas.width,
	// 		height: canvas.height,
	// 		view: canvas,
	// 		transparent: true,
	// 		antialias: true,
	// 	});
	// 	appRef.current = app;

	// 	const shapes: PIXI.Container[] = [];

	// 	const actionState = getActionState();
	// 	const { compositionState } = actionState;

	// 	const { compositionId } = props.areaState;
	// 	const composition = compositionState.compositions[compositionId];

	// 	for (const layerId of composition.layers) {
	// 		const layer = compositionState.layers[layerId];
	// 		const node = layerToPixi(actionState, layer);
	// 		shapes.push(node);
	// 	}

	// 	// const N = 200;
	// 	// for (let i = 0; i < N; i++) {
	// 	// 	const shape = new PIXI.Graphics()
	// 	// 		.beginFill(0x7700ff)
	// 	// 		.lineStyle(2, 0xff0000, 1)
	// 	// 		.moveTo(100, 100)
	// 	// 		.bezierCurveTo(150, 100, 200, 150, 200, 200)
	// 	// 		.lineTo(180, 200)
	// 	// 		.bezierCurveTo(180, 120, 120, 120, 100, 120)
	// 	// 		.closePath();
	// 	// 	// shape.scale.set(interpolate(0.1, 4, i / N));
	// 	// 	shape.pivot.set(200, 200);
	// 	// 	shapes.push(shape);
	// 	// }

	// 	const tick = () => {
	// 		requestAnimationFrame(tick);

	// 		for (let i = 0; i < shapes.length; i++) {
	// 			const shape = shapes[i];
	// 			shape.position.set(500 + i * 50, 500 + i * 50);
	// 			shape.rotation += 0.01;
	// 		}
	// 	};
	// 	tick();

	// 	app.stage.addChild(...shapes);
	// }, []);

	const renderWorkspace = useCallback((options: ReturnType<typeof getOptions>) => {
		const props = propsRef.current;
		const app = appRef.current;

		if (!app) {
			return;
		}

		if (app.screen.width !== props.width || app.screen.height !== props.height) {
			console.log("updating size");
			app.screen.width = props.width;
			app.screen.height = props.height;
		}
	}, []);

	const keyDownRef = useRef({ Shift: false, Command: false });

	useEffect(() => {
		let mounted = true;

		const tick = () => {
			if (mounted) {
				requestAnimationFrame(tick);
			}

			// const mainCtx = canvasRef.current?.getContext("2d");
			const guidesCtx = guideCanvasRef.current?.getContext("2d");

			if (!guidesCtx) {
				return;
			}

			const playback = getCompositionPlayback(propsRef.current.areaState.compositionId);
			if (playback) {
				shouldRenderRef.current = false;
				renderWorkspace(
					getOptions(
						propsRef.current,
						null as any,
						undefined,
						keyDownRef.current,
						playback.frameIndex,
					),
				);
				return;
			}

			const render = shouldRenderRef.current;
			const renderGuides = render || shouldRenderGuidesRef.current;

			if (render) {
				shouldRenderRef.current = false;
				renderWorkspace(
					getOptions(propsRef.current, null as any, undefined, keyDownRef.current),
				);
			}

			if (renderGuides) {
				shouldRenderGuidesRef.current = false;
				renderWorkspaceGuides(
					getOptions(
						propsRef.current,
						guidesCtx,
						mousePositionRef.current,
						keyDownRef.current,
					),
				);
			}
		};
		tick();

		return () => {
			mounted = false;
		};
	}, []);

	useCompositionPlayback(props.areaState.compositionId, propsRef);

	useEffect(() => {
		shouldRenderRef.current = true;
	}, [props]);

	useKeyDownEffect("Command", (keyDown) => {
		keyDownRef.current.Command = keyDown;
		shouldRenderRef.current = true;
	});
	useKeyDownEffect("Shift", (keyDown) => {
		keyDownRef.current.Shift = keyDown;
		shouldRenderRef.current = true;
	});

	const { left, top, width, height } = props;

	const setCursor = useWorkspaceCursor(guideCanvasRef, {
		compositionId: props.areaState.compositionId,
		viewport: { width, left, top, height },
		areaId: props.areaId,
	});

	const onMouseMove = (e: React.MouseEvent) => {
		shouldRenderGuidesRef.current = true;
		mousePositionRef.current = Vec2.fromEvent(e);
		setCursor(e);
	};

	const onMouseOut = (e: React.MouseEvent) => {
		shouldRenderGuidesRef.current = true;
		mousePositionRef.current = undefined;
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
			/>
			<canvas
				ref={guideCanvasRef}
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
		</div>
	);
};

export const PixiWorkspace = WorkspaceComponent;
