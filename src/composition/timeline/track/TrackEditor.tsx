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
	getCompTimeTrackYPositions,
} from "~/composition/timeline/compTimeUtils";
import {
	applyTimelineIndexAndValueShifts,
	transformTimelineXToGlobalX,
} from "~/timeline/timelineUtils";
import { valueWithinRange, valueWithinMargin } from "~/util/math";
import { COMP_TIME_TRACK_START_END_X_MARGIN } from "~/constants";

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
			layerLengthShift,
		});
	}, [props]);

	const onMouseMove = (e: React.MouseEvent) => {
		const canvasEl = canvasRef.current;

		if (!canvasEl) {
			return;
		}

		const { composition, compositionState, viewBounds, viewport } = props;

		const mousePos = Vec2.fromEvent(e);
		const yPosMap = getCompTimeTrackYPositions(composition.id, compositionState, panY);

		for (let i = 0; i < composition.layers.length; i += 1) {
			const layerId = composition.layers[i];
			const yPos = yPosMap.layer[layerId];

			if (!valueWithinRange(mousePos.y - viewport.top, yPos, yPos + 16)) {
				continue;
			}

			const layer = compositionState.layers[layerId];

			const startX = transformTimelineXToGlobalX(
				layer.index,
				viewBounds,
				viewport,
				composition.length,
			);
			if (valueWithinMargin(mousePos.x, startX, COMP_TIME_TRACK_START_END_X_MARGIN)) {
				canvasEl.style.cursor = "ew-resize";
				return;
			}

			const endX = transformTimelineXToGlobalX(
				layer.index + layer.length,
				viewBounds,
				viewport,
				composition.length,
			);
			if (valueWithinMargin(mousePos.x, endX, COMP_TIME_TRACK_START_END_X_MARGIN)) {
				canvasEl.style.cursor = "ew-resize";
				return;
			}
		}

		canvasEl.style.cursor = "";
	};

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
				onMouseMove={onMouseMove}
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
