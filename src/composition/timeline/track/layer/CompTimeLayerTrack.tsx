import React from "react";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { connectActionState } from "~/state/stateUtils";
import CompTimeLayerTrackStyles from "~/composition/timeline/track/layer/CompTimeLayerTrack.styles";
import { CompTimePropertyTrack } from "~/composition/timeline/track/property/CompTimePropertyTrack";

const s = compileStylesheetLabelled(CompTimeLayerTrackStyles);

interface OwnProps {
	layerId: string;
	toTimelineX: (value: number) => number;
}
interface StateProps {
	compositionLength: number;
	startIndex: number;
	layerLength: number;
	properties: string[];
}
type Props = OwnProps & StateProps;

const CompTimeLayerTrackComponent: React.FC<Props> = (props) => {
	const { startIndex, layerLength, compositionLength, properties } = props;

	const x0 = props.toTimelineX(startIndex);
	const x1 = props.toTimelineX(startIndex + layerLength);

	const left = x0;
	const width = x1 - x0;

	return (
		<div>
			<div className={s("bar")} style={{ width, transform: `translateX(${left}px)` }} />
			{properties.map((propertyId) => (
				<CompTimePropertyTrack
					propertyId={propertyId}
					key={propertyId}
					startIndex={startIndex}
					compositionLength={compositionLength}
					toTimelineX={props.toTimelineX}
				/>
			))}
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ compositions }, { layerId }) => {
	const layer = compositions.layers[layerId];
	const composition = compositions.compositions[layer.compositionId];

	return {
		compositionLength: composition.length,
		layerLength: layer.length,
		startIndex: layer.index,
		properties: layer.properties,
	};
};

export const CompTimeLayerTrack = connectActionState(mapStateToProps)(CompTimeLayerTrackComponent);
