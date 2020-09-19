import React, { useEffect, useRef, useState } from "react";
import { areaActions } from "~/area/state/areaActions";
import { COMP_TIME_SEPARATOR_WIDTH, TRACKPAD_ZOOM_DELTA_FAC } from "~/constants";
import { GraphEditor } from "~/graphEditor/GraphEditor";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { TimelineScrubber } from "~/timeline/scrubber/TimelineScrubber";
import styles from "~/timeline/Timeline.styles";
import { timelineAreaActions, TimelineAreaState } from "~/timeline/timelineAreaReducer";
import { timelineHandlers } from "~/timeline/timelineHandlers";
import { TimelineLayerList } from "~/timeline/TimelineLayerList";
import { TimelineViewBounds } from "~/timeline/TimelineViewBounds";
import { TrackEditor } from "~/trackEditor/TrackEditor";
import { AreaComponentProps } from "~/types/areaTypes";
import { capToRange, isVecInRect, splitRect } from "~/util/math";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { parseWheelEvent } from "~/util/wheelEvent";

const s = compileStylesheetLabelled(styles);

type OwnProps = AreaComponentProps<TimelineAreaState>;
interface StateProps {
	compositionLength: number;
}
type Props = OwnProps & StateProps;

const TimelineComponent: React.FC<Props> = (props) => {
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

	const wrapperRef = useRef<HTMLDivElement>(null);

	const propsRef = useRef<Props>(props);
	propsRef.current = props;

	useEffect(() => {
		if (!wrapperRef.current) {
			return;
		}

		const listener = (e: WheelEvent) => {
			e.preventDefault();

			const props = propsRef.current;

			const parsed = parseWheelEvent(e);
			const { compositionLength } = props;
			const { panY, viewBounds } = props.areaState;
			let [viewportLeft, viewportRight] = splitRect(
				"horizontal",
				props,
				t,
				COMP_TIME_SEPARATOR_WIDTH,
			);

			const onPan = () => {
				const lockY = props.areaState.graphEditorOpen
					? !isVecInRect(Vec2.fromEvent(e), viewportLeft)
					: false;

				timelineHandlers.onWheelPan(e as any, props.areaId, {
					compositionId,
					viewport: viewportRight,
					compositionLength,
					viewBounds,
					lockY,
					panY,
				});
			};

			switch (parsed.type) {
				case "pinch_zoom": {
					timelineHandlers.onWheelZoom(
						e,
						props.areaId,
						Math.abs(e.deltaY) * TRACKPAD_ZOOM_DELTA_FAC,
						{
							viewBounds,
							width: viewportRight.width,
							left: viewportRight.left,
						},
					);
					break;
				}

				case "pan": {
					onPan();
					break;
				}

				case "mouse_wheel": {
					onPan();
					break;
				}
			}
		};

		const el = wrapperRef.current;
		el.addEventListener("wheel", listener, { passive: false });

		return () => {
			el.removeEventListener("wheel", listener);
		};
	}, [wrapperRef.current, t]);

	const { compositionId, viewBounds, panY } = props.areaState;
	const { compositionLength } = props;

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
						timelineHandlers.onPan(e, props.areaId, {
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
					left: () => timelineHandlers.onMouseDownOut(compositionId),
					right: (e) => timelineHandlers.onRightClickOut(e, compositionId),
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
										timelineAreaActions.toggleGraphEditorOpen(),
									),
								);
								params.submitAction();
							});
						}}
					>
						Graph Editor
					</button>
				</div>
				<TimelineLayerList
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
				<TimelineViewBounds
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
											timelineAreaActions.setViewBounds(viewBounds),
										),
									);
								},
								submit: () => params.submitAction(),
							});
						});
					}}
					viewBounds={viewBounds}
				/>
				<TimelineScrubber
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
								timelineHandlers.onZoomClick(e, props.areaId, {
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
							timelineAreaId={props.areaId}
							trackDragSelectRect={props.areaState.trackDragSelectRect}
							layerIndexShift={props.areaState.layerIndexShift}
							layerLengthShift={props.areaState.layerLengthShift}
						/>
					)}
					{props.areaState.graphEditorOpen && (
						<GraphEditor
							areaId={props.areaId}
							compositionId={compositionId}
							viewport={{
								width: viewportRight.width,
								height: viewportRight.height - 32,
								left: viewportRight.left,
								top: viewportRight.top + 32,
							}}
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

export const Timeline = connectActionState(mapStateToProps)(TimelineComponent);
