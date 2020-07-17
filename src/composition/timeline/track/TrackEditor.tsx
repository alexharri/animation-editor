import React, { useRef, useLayoutEffect } from "react";
import { connectActionState } from "~/state/stateUtils";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";
import { cssVariables } from "~/cssVariables";
import { Composition } from "~/composition/compositionTypes";
import { CompositionSelectionState } from "~/composition/state/compositionSelectionReducer";
import { CompositionState } from "~/composition/state/compositionReducer";
import { TimelineState } from "~/timeline/timelineReducer";
import { renderTracks } from "~/composition/timeline/track/renderTracks";

interface OwnProps {
	compositionId: string;
	viewport: Rect;
	viewBounds: [number, number];
}
interface StateProps {
	composition: Composition;
	compositionSelection: CompositionSelectionState;
	compositionState: CompositionState;
	timelines: TimelineState;
	timelineSelection: TimelineSelectionState;
	dragSelectRect: Rect | null;
}
type Props = OwnProps & StateProps;

const TrackEditorComponent: React.FC<Props> = (props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useLayoutEffect(() => {
		const ctx = canvasRef.current?.getContext("2d");

		if (!ctx) {
			return;
		}

		const {
			timelines,
			dragSelectRect,
			compositionState,
			compositionSelection,
			viewBounds,
			composition,
			timelineSelection,
			viewport,
		} = props;

		renderTracks({
			ctx,
			composition,
			compositionSelection,
			compositionState,
			dragSelectRect,
			timelines,
			pan: Vec2.new(0, 0),
			timelineSelection,
			viewBounds,
			viewportHeight: viewport.height,
			viewportWidth: viewport.width,
		});
	}, [props]);

	const { width, height } = props.viewport;

	return (
		<div style={{ background: cssVariables.gray400 }}>
			<canvas ref={canvasRef} height={height} width={width} />
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
		dragSelectRect: null,
		timelines,
		timelineSelection: timelineSelection,
	};
};

export const TrackEditor = connectActionState(mapStateToProps)(TrackEditorComponent);
