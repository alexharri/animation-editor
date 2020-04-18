import React, { useRef, useEffect } from "react";
import { AreaWindowProps } from "~/types/areaTypes";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineEditorAreaState } from "~/timeline/timelineEditorAreaState";
import { renderTimeline } from "~/timeline/renderTimeline";
import { useStylesheet } from "~/util/stylesheets";
import TimelineEditorStyles, {
	TIMELINE_CANVAS_HEIGHT_REDUCTION,
} from "~/timeline/TimelineEditor.styles";
import { separateLeftRightMouse } from "~/util/mouse";
import { timelineViewBoundsHandlers } from "~/timeline/timelineViewBoundsHandlers";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";
import { connectActionState } from "~/state/stateUtils";
import { timelineHandlers } from "~/timeline/timelineHandlers";
import { useKeyDownEffect } from "~/hook/useKeyDown";

type OwnProps = AreaWindowProps<TimelineEditorAreaState>;
interface StateProps {
	timeline: TimelineState[string];
}
type Props = OwnProps & StateProps;

const TimelineEditorComponent: React.FC<Props> = (props) => {
	const s = useStylesheet(TimelineEditorStyles);
	// const yUpper = 500;
	// const yLower = 0;
	const { viewport } = props;

	const canvasRef = useRef<HTMLCanvasElement>(null);
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

	useEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		let { width, height } = viewport;
		const { viewBounds } = props.areaState;

		height -= TIMELINE_CANVAS_HEIGHT_REDUCTION;

		const timeline = applyTimelineIndexAndValueShifts(props.timeline);

		renderTimeline({
			ctx,
			width,
			height,
			timeline,
			viewBounds,
		});
	}, [props]);

	const { viewBounds } = props.areaState;
	let { width, height } = viewport;

	height -= TIMELINE_CANVAS_HEIGHT_REDUCTION;

	const left = width * viewBounds[0];
	const right = width * (1 - viewBounds[1]);

	return (
		<div>
			<div className={s("header")}></div>
			<div className={s("viewBounds")}>
				<div
					className={s("viewBounds__inner")}
					style={{
						left: `${left}px`,
						right: `${right}px`,
					}}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							timelineViewBoundsHandlers.onMoveViewBounds(e, props.areaId, viewport),
					})}
				>
					<div
						className={s("viewBounds__handle", { left: true })}
						style={{ left: Math.max(0, 6 - left) }}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								timelineViewBoundsHandlers.onLeftHandleMouseDown(
									e,
									props.areaId,
									viewport,
								),
						})}
					/>
					<div
						className={s("viewBounds__handle", { right: true })}
						style={{ right: Math.max(0, 6 - right) }}
						onMouseDown={separateLeftRightMouse({
							left: (e) =>
								timelineViewBoundsHandlers.onRightHandleMouseDown(
									e,
									props.areaId,
									viewport,
								),
						})}
					/>
				</div>
			</div>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				onMouseDown={(e) =>
					timelineHandlers.onMouseDown(e, {
						timeline: props.timeline,
						viewBounds,
						viewport,
					})
				}
			/>
			<div
				className={s("zoomTarget")}
				ref={zoomTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						timelineHandlers.onZoomClick(e, props.areaId, {
							viewBounds,
							viewport,
							timeline: props.timeline,
						}),
				})}
			/>
			<div
				className={s("panTarget")}
				ref={panTarget}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						timelineViewBoundsHandlers.onPanViewBounds(e, props.areaId, {
							viewBounds,
							viewport,
							timeline: props.timeline,
						}),
				})}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ timelines }, ownProps) => ({
	timeline: timelines[ownProps.areaState.timelineId],
});

export const TimelineEditor = connectActionState(mapStateToProps)(TimelineEditorComponent);
