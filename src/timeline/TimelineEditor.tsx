import React, { useRef, useEffect } from "react";
import { TimelineState } from "~/timeline/timelineReducer";
import { renderTimeline } from "~/timeline/renderTimeline";
import { separateLeftRightMouse } from "~/util/mouse";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";
import { connectActionState } from "~/state/stateUtils";
import { timelineHandlers } from "~/timeline/timelineHandlers";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";

interface OwnProps {
	id: string;
	length: number;
	viewBounds: [number, number];
	viewport: Rect;
}
interface StateProps {
	timeline: TimelineState[string];
	selection: TimelineSelectionState;
}
type Props = OwnProps & StateProps;

const TimelineEditorComponent: React.FC<Props> = (props) => {
	const { viewport, length, selection } = props;

	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		const { width, height } = viewport;

		const timeline = applyTimelineIndexAndValueShifts(props.timeline, props.selection);

		renderTimeline({
			ctx,
			length,
			width,
			height,
			timeline,
			viewBounds,
			selection,
		});
	}, [props]);

	const { viewBounds } = props;
	const { width, height } = viewport;

	return (
		<div>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				onMouseDown={separateLeftRightMouse({
					left: (e) =>
						timelineHandlers.onMouseDown(e, {
							timeline: props.timeline,
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
	timeline: timelines[ownProps.id],
	selection: timelineSelection,
});

export const TimelineEditor = connectActionState(mapStateToProps)(TimelineEditorComponent);
