import React, { useRef, useLayoutEffect } from "react";
import { renderTimeline } from "~/timeline/renderTimeline";
import { separateLeftRightMouse } from "~/util/mouse";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";
import { connectActionState } from "~/state/stateUtils";
import { timelineHandlers } from "~/timeline/timelineHandlers";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { Timeline } from "~/timeline/timelineTypes";
import { cssVariables } from "~/cssVariables";

interface OwnProps {
	ids: string[];
	colors: Partial<{ [timelineId: string]: string }>;
	length: number;
	viewBounds: [number, number];
	viewport: Rect;
	dragSelectRect: Rect | null;
	compositionTimelineAreaId: string;
}
interface StateProps {
	timelines: Timeline[];
	selection: TimelineSelectionState;
}
type Props = OwnProps & StateProps;

const TimelineEditorComponent: React.FC<Props> = (props) => {
	const { viewport, length, selection, colors, dragSelectRect } = props;

	const canvasRef = useRef<HTMLCanvasElement>(null);

	useLayoutEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		const { width, height } = viewport;

		const timelines = props.timelines.map((timeline) =>
			applyTimelineIndexAndValueShifts(timeline, props.selection[timeline.id]),
		);

		renderTimeline({
			ctx,
			length,
			width,
			height,
			timelines,
			colors,
			viewBounds,
			selection,
			dragSelectRect,
		});
	}, [props]);

	const { viewBounds } = props;
	const { width, height } = viewport;

	return (
		<div style={{ background: cssVariables.gray400 }}>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						timelineHandlers.onMouseDown(e, {
							compositionTimelineAreaId: props.compositionTimelineAreaId,
							timelines: props.timelines,
							length,
							viewBounds,
							viewport,
						}),
				})}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ timelines, timelineSelection },
	ownProps,
) => ({
	timelines: ownProps.ids.map((id) => timelines[id]),
	selection: timelineSelection,
});

export const TimelineEditor = connectActionState(mapStateToProps)(TimelineEditorComponent);
