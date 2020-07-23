import React, { useLayoutEffect, useRef } from "react";
import { Composition } from "~/composition/compositionTypes";
import { CompositionState } from "~/composition/state/compositionReducer";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import {
	capCompTimePanY,
	getTimelineIdsReferencedByComposition,
} from "~/composition/timeline/compTimeUtils";
import { renderTracks } from "~/composition/timeline/track/renderTracks";
import { trackHandlers } from "~/composition/timeline/track/trackHandlers";
import { useTrackEditorCanvasCursor } from "~/composition/timeline/track/useTrackEditorCanvasCursor";
import { cssVariables } from "~/cssVariables";
import { connectActionState } from "~/state/stateUtils";
import { TimelineState } from "~/timeline/timelineReducer";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";

interface OwnProps {
	compositionId: string;
	viewport: Rect;
	viewBounds: [number, number];
	panY: number;
	compositionTimelineAreaId: string;
	trackDragSelectRect: Rect | null;
	layerIndexShift: number;
	layerLengthShift: [number, number];
}
interface StateProps {
	composition: Composition;
	compositionSelectionState: CompositionSelectionState;
	compositionState: CompositionState;
	timelines: TimelineState;
	timelineSelection: TimelineSelectionState;
}
type Props = OwnProps & StateProps;

const TrackEditorComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const panY = capCompTimePanY(
		props.panY,
		props.compositionId,
		props.viewport.height,
		props.compositionState,
	);

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
			timelineSelection,
			viewport,
			layerIndexShift,
			layerLengthShift,
		} = props;

		const timelineIds = getTimelineIdsReferencedByComposition(composition.id, compositionState);
		const timelines = timelineIds
			.map((id) =>
				applyTimelineIndexAndValueShifts(props.timelines[id], timelineSelection[id]),
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
			timelineSelection,
			viewBounds,
			viewportHeight: viewport.height,
			viewportWidth: viewport.width,
			layerIndexShift,
			layerLengthShift,
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
				onMouseDown={(e) => {
					trackHandlers.onMouseDown(e, {
						compositionId,
						compositionTimelineAreaId: props.compositionTimelineAreaId,
						compositionLength: composition.length,
						panY,
						viewBounds,
						viewport,
					});
				}}
				onMouseMove={onMouseMove}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState, timelines, timelineSelection },
	{ compositionId },
) => {
	const composition = compositionState.compositions[compositionId];
	return {
		composition,
		compositionSelectionState,
		compositionState,
		timelines,
		timelineSelection: timelineSelection,
	};
};

export const TrackEditor = connectActionState(mapStateToProps)(TrackEditorComponent);
