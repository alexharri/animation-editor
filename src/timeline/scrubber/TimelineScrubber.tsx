import React, { useEffect, useRef } from "react";
import { COMP_TIME_SCRUBBER_HEIGHT } from "~/constants";
import { createToGraphEditorViewportX } from "~/graphEditor/renderGraphEditor";
import { connectActionState } from "~/state/stateUtils";
import { renderTimelineScrubber } from "~/timeline/scrubber/renderTimelineScrubber";
import TimelineScrubberStyles from "~/timeline/scrubber/TimelineScrubber.styles";
import { timelineHandlers } from "~/timeline/timelineHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(TimelineScrubberStyles);

interface OwnProps {
	compositionId: string;
	viewBounds: [number, number];
	viewportRight: Rect;
}
interface StateProps {
	length: number;
	frameIndex: number;
}
type Props = OwnProps & StateProps;

const TimelineScrubberComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const toTimelineX = createToGraphEditorViewportX({
		length: props.length,
		viewBounds: props.viewBounds,
		width: props.viewportRight.width,
	});

	useEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		renderTimelineScrubber(ctx, {
			length: props.length,
			viewBounds: props.viewBounds,
			width: props.viewportRight.width,
		});
	}, [props.length, props.viewBounds, props.viewportRight.width]);

	return (
		<div className={s("wrapper")}>
			<canvas
				className={s("canvas")}
				width={props.viewportRight.width}
				height={COMP_TIME_SCRUBBER_HEIGHT}
				ref={canvasRef}
			/>
			<div
				className={s("interactionArea")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						timelineHandlers.onScrubMouseDown(e, {
							compositionId: props.compositionId,
							viewBounds: props.viewBounds,
							viewport: props.viewportRight,
							compositionLength: props.length,
						});
					},
				})}
			/>
			<div className={s("head")} style={{ left: toTimelineX(props.frameIndex) }}>
				<div className={s("scrubLine")} style={{ height: props.viewportRight.height }} />
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState: compositions },
	ownProps,
) => {
	const composition = compositions.compositions[ownProps.compositionId];
	return {
		frameIndex: composition.frameIndex,
		length: composition.length,
	};
};

export const TimelineScrubber = connectActionState(mapStateToProps)(TimelineScrubberComponent);
