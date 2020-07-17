import React from "react";
import { createToTimelineViewportX } from "~/timeline/renderTimeline";
import { connectActionState } from "~/state/stateUtils";
import { CompTimeLayerTrack } from "~/composition/timeline/track/layer/CompTimeLayerTrack";
import { cssVariables } from "~/cssVariables";

interface OwnProps {
	compositionId: string;
	width: number;
	viewBounds: [number, number];
}
interface StateProps {
	layerIds: string[];
	compositionLength: number;
}
type Props = OwnProps & StateProps;

const CompTimeTrackManagerComponent: React.FC<Props> = (props) => {
	const { width, viewBounds, layerIds, compositionLength } = props;

	const toViewportX = createToTimelineViewportX({
		length: compositionLength,
		viewBounds,
		width,
	});

	return (
		<div style={{ background: cssVariables.dark300 }}>
			{layerIds.map((id) => (
				<CompTimeLayerTrack layerId={id} key={id} toTimelineX={toViewportX} />
			))}
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositions }, { compositionId }) => {
	const composition = compositions.compositions[compositionId];
	return {
		compositionLength: composition.length,
		layerIds: composition.layers,
	};
};

export const CompTimeTrackManager = connectActionState(mapState)(CompTimeTrackManagerComponent);
