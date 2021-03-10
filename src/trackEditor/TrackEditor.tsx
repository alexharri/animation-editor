import React, { useLayoutEffect, useRef } from "react";
import { CompositionState } from "~/composition/compositionReducer";
import { CompositionSelectionState } from "~/composition/compositionSelectionReducer";
import { Composition } from "~/composition/compositionTypes";
import { getTimelineIdsReferencedByComposition } from "~/composition/compositionUtils";
import { cssVariables } from "~/cssVariables";
import { connectActionState } from "~/state/stateUtils";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";
import { renderTracks } from "~/trackEditor/renderTrackEditor";
import { trackHandlers } from "~/trackEditor/trackHandlers";
import { useTrackEditorCanvasCursor } from "~/trackEditor/useTrackEditorCanvasCursor";
import { separateLeftRightMouse } from "~/util/mouse";

interface OwnProps {
	compositionId: string;
	viewport: Rect;
	viewBounds: [number, number];
	panY: number;
	timelineAreaId: string;
	trackDragSelectRect: Rect | null;
}
interface StateProps {
	composition: Composition;
	compositionSelectionState: CompositionSelectionState;
	compositionState: CompositionState;
	timelineState: TimelineState;
	timelineSelectionState: TimelineSelectionState;
}
type Props = OwnProps & StateProps;

const TrackEditorComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const { panY } = props;

	useLayoutEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		const {
			trackDragSelectRect,
			compositionState,
			compositionSelectionState,
			viewBounds,
			composition,
			timelineSelectionState,
			viewport,
		} = props;

		const timelineIds = getTimelineIdsReferencedByComposition(composition.id, compositionState);
		const timelines = timelineIds
			.map((id) =>
				applyTimelineIndexAndValueShifts(
					props.timelineState[id],
					timelineSelectionState[id],
				),
			)
			.reduce<TimelineState>((obj, timeline) => {
				obj[timeline.id] = timeline;
				return obj;
			}, {});

		renderTracks({
			ctx,
			composition,
			compositionSelectionState,
			compositionState,
			trackDragSelectRect,
			timelines,
			panY,
			timelineSelection: timelineSelectionState,
			viewBounds,
			viewportHeight: viewport.height,
			viewportWidth: viewport.width,
		});
	}, [props]);

	const { compositionId, composition, viewBounds, viewport } = props;
	const { width, height } = viewport;

	const onMouseMove = useTrackEditorCanvasCursor(canvasRef, {
		compositionId,
		viewBounds,
		viewport,
		panY,
	});

	return (
		<div style={{ background: cssVariables.gray400 }}>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						trackHandlers.onMouseDown(e, {
							compositionId,
							timelineAreaId: props.timelineAreaId,
							compositionLength: composition.length,
							panY,
							viewBounds,
							viewport,
						});
					},
				})}
				onMouseMove={onMouseMove}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState, timelineState, timelineSelectionState },
	{ compositionId },
) => {
	const composition = compositionState.compositions[compositionId];
	return {
		composition,
		compositionSelectionState,
		compositionState,
		timelineState,
		timelineSelectionState,
	};
};

export const TrackEditor = connectActionState(mapStateToProps)(TrackEditorComponent);
