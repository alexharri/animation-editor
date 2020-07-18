import React, { useRef, useLayoutEffect } from "react";
import { connectActionState } from "~/state/stateUtils";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { cssVariables } from "~/cssVariables";
import { Composition } from "~/composition/compositionTypes";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import { CompositionState } from "~/composition/state/compositionReducer";
import { TimelineState } from "~/timeline/timelineReducer";
import { renderTracks } from "~/composition/timeline/track/renderTracks";
import { trackHandlers } from "~/composition/timeline/track/trackHandlers";
import {
	getTimelineIdsReferencedByComposition,
	capCompTimePanY,
} from "~/composition/timeline/compTimeUtils";
import { applyTimelineIndexAndValueShifts } from "~/timeline/timelineUtils";

interface OwnProps {
	compositionId: string;
	viewport: Rect;
	viewBounds: [number, number];
	panY: number;
	compositionTimelineAreaId: string;
	trackDragSelectRect: Rect | null;
	layerIndexShift: number;
}
interface StateProps {
	composition: Composition;
	compositionSelection: CompositionSelectionState;
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
			compositionSelection,
			viewBounds,
			composition,
			timelineSelection,
			viewport,
			layerIndexShift,
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
			compositionSelection,
			compositionState,
			trackDragSelectRect,
			timelines,
			panY,
			timelineSelection,
			viewBounds,
			viewportHeight: viewport.height,
			viewportWidth: viewport.width,
			layerIndexShift,
		});
	}, [props]);

	const { width, height } = props.viewport;

	return (
		<div style={{ background: cssVariables.gray400 }}>
			<canvas
				ref={canvasRef}
				height={height}
				width={width}
				onMouseDown={(e) => {
					trackHandlers.onMouseDown(e, {
						compositionId: props.compositionId,
						compositionTimelineAreaId: props.compositionTimelineAreaId,
						length: props.composition.length,
						panY,
						viewBounds: props.viewBounds,
						viewport: props.viewport,
					});
				}}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositions, compositionSelection, timelines, timelineSelection },
	{ compositionId },
) => {
	const composition = compositions.compositions[compositionId];
	return {
		composition,
		compositionSelection,
		compositionState: compositions,
		timelines,
		timelineSelection: timelineSelection,
	};
};

export const TrackEditor = connectActionState(mapStateToProps)(TrackEditorComponent);
