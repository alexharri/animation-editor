import React, { useEffect, useRef, useState } from "react";
import { areaActions } from "~/area/state/areaActions";
import styles from "~/composition/timeline/CompTime.styles";
import { compTimeAreaActions, CompTimeAreaState } from "~/composition/timeline/compTimeAreaReducer";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { CompTimeLayerList } from "~/composition/timeline/CompTimeLayerList";
import { CompTimeTimeline } from "~/composition/timeline/CompTimeTimeline";
import { capCompTimePanY } from "~/composition/timeline/compTimeUtils";
import { CompTimeScrubber } from "~/composition/timeline/scrubber/CompTimeScrubber";
import { TrackEditor } from "~/composition/timeline/track/TrackEditor";
import { COMP_TIME_SEPARATOR_WIDTH } from "~/constants";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { ViewBounds } from "~/timeline/ViewBounds";
import { AreaComponentProps } from "~/types/areaTypes";
import { capToRange, isVecInRect, splitRect } from "~/util/math";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaComponentProps<CompTimeAreaState>;
interface StateProps {
	compositionLength: number;
}
type Props = OwnProps & StateProps;

const CompTimeComponent: React.FC<Props> = (props) => {
	const { compositionId, viewBounds } = props.areaState;
	const { compositionLength } = props;

	const [t, setT] = useState(0.3);

	let [viewportLeft, viewportRight] = splitRect(
		"horizontal",
		props,
		t,
		COMP_TIME_SEPARATOR_WIDTH,
	);

	const zoomTarget = useRef<HTMLDivElement>(null);
	const panTarget = useRef<HTMLDivElement>(null);

	useKeyDownEffect("Z", (down) => {
		if (zoomTarget.current) {
			zoomTarget.current.style.display = down ? "block" : "";
		}
	});
	useKeyDownEffect("Space", (down) => {
		if (panTarget.current) {
			panTarget.current.style.display = down ? "block" : "";
		}
	});

	const onMouseDown: RequestActionCallback = (params) => {
		const { addListener, submitAction } = params;

		addListener.repeated("mousemove", (e) => {
			const pos = Vec2.fromEvent(e).subX(props.left);
			setT(capToRange(0.1, 0.8, pos.x / props.width));
		});

		addListener.once("mouseup", () => {
			submitAction();
		});
	};

	const outRef = useRef<HTMLDivElement>(null);

	const panY = props.areaState.panY;
	// const panY = capCompTimePanY(
	// 	props.areaState.panY,
	// 	composition.id,
	// 	props.height - 32,
	// 	props.compositionState,
	// );

	const wrapperRef = useRef<HTMLDivElement>(null);

	const propsRef = useRef<Props>(props);
	propsRef.current = props;

	useEffect(() => {
		if (!wrapperRef.current) {
			return;
		}

		const listener = (e: WheelEvent) => {
			const props = propsRef.current;

			e.preventDefault();

			const { compositionState } = getActionState();

			const panY = capCompTimePanY(
				props.areaState.panY,
				compositionId,
				props.height,
				compositionState,
			);

			let [viewportLeft, viewportRight] = splitRect(
				"horizontal",
				props,
				t,
				COMP_TIME_SEPARATOR_WIDTH,
			);
			const lockY = props.areaState.graphEditorOpen
				? !isVecInRect(Vec2.fromEvent(e), viewportLeft)
				: false;

			compTimeHandlers.onWheelPan(e as any, props.areaId, {
				compositionId,
				viewport: viewportRight,
				compositionLength,
				viewBounds,
				lockY,
				panY,
			});
		};

		const el = wrapperRef.current;
		el.addEventListener("wheel", listener, { passive: false });

		return () => {
			el.removeEventListener("wheel", listener);
		};
	}, [wrapperRef.current]);

	return (
		<div className={s("wrapper")} ref={wrapperRef}>
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						const lockY = props.areaState.graphEditorOpen
							? !isVecInRect(Vec2.fromEvent(e), viewportLeft)
							: false;
						compTimeHandlers.onPan(e, props.areaId, {
							compositionId,
							viewport: viewportRight,
							compositionLength,
							viewBounds,
							lockY,
							panY,
						});
					},
				})}
			/>
			<div
				className={s("left")}
				style={viewportLeft}
				ref={outRef}
				onMouseDown={separateLeftRightMouse({
					left: () => compTimeHandlers.onMouseDownOut(compositionId),
					right: (e) => compTimeHandlers.onRightClickOut(e, compositionId),
				})}
			>
				<div className={s("header")}>
					<button
						className={s("graphEditorToggle")}
						onMouseDown={(e) => e.stopPropagation()}
						onClick={() => {
							requestAction({ history: false }, (params) => {
								params.dispatch(
									areaActions.dispatchToAreaState(
										props.areaId,
										compTimeAreaActions.toggleGraphEditorOpen(),
									),
								);
								params.submitAction();
							});
						}}
					>
						Graph Editor
					</button>
				</div>
				<CompTimeLayerList
					compositionId={compositionId}
					moveLayers={props.areaState.moveLayers}
					panY={props.areaState.panY}
				/>
			</div>
			<div
				className={s("separator")}
				style={{ left: viewportLeft.width }}
				onMouseDown={separateLeftRightMouse({
					left: () => requestAction({ history: false }, onMouseDown),
				})}
			/>
			<div className={s("right")} style={viewportRight}>
				<ViewBounds
					left={viewportRight.left}
					width={viewportRight.width}
					compositionLength={compositionLength}
					requestUpdate={(cb) => {
						requestAction({ history: false }, (params) => {
							cb({
								addListener: params.addListener,
								update: (viewBounds) => {
									params.dispatch(
										areaActions.dispatchToAreaState(
											props.areaId,
											compTimeAreaActions.setViewBounds(viewBounds),
										),
									);
								},
								submit: () => params.submitAction(),
							});
						});
					}}
					viewBounds={viewBounds}
				/>
				<CompTimeScrubber
					compositionId={compositionId}
					viewportRight={viewportRight}
					viewBounds={viewBounds}
				/>
				<div style={{ position: "relative" }}>
					<div
						className={s("zoomTarget")}
						ref={zoomTarget}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								compTimeHandlers.onZoomClick(e, props.areaId, {
									viewBounds,
									left: viewportRight.left,
									width: viewportRight.width,
								}),
						})}
					/>
					{!props.areaState.graphEditorOpen && (
						<TrackEditor
							panY={props.areaState.panY}
							viewBounds={viewBounds}
							compositionId={compositionId}
							viewport={{
								width: viewportRight.width,
								height: viewportRight.height - 32,
								left: viewportRight.left,
								top: viewportRight.top + 32,
							}}
							compositionTimelineAreaId={props.areaId}
							trackDragSelectRect={props.areaState.trackDragSelectRect}
							layerIndexShift={props.areaState.layerIndexShift}
							layerLengthShift={props.areaState.layerLengthShift}
						/>
					)}
					{props.areaState.graphEditorOpen && (
						<CompTimeTimeline
							areaId={props.areaId}
							compositionId={props.areaState.compositionId}
							dragSelectRect={props.areaState.dragSelectRect}
							viewBounds={props.areaState.viewBounds}
							viewport={viewportRight}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ compositionState }, ownProps) => {
	const composition = compositionState.compositions[ownProps.areaState.compositionId];

	return {
		compositionLength: composition.length,
	};
};

export const CompTime = connectActionState(mapStateToProps)(CompTimeComponent);
