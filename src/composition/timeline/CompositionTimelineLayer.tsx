import React from "react";
import { useStylesheet } from "~/util/stylesheets";
import { CompositionLayer } from "~/composition/compositionTypes";
import styles from "~/composition/timeline/CompositionTimelineLayer.style";
import { CompositionTimelineLayerProperty } from "~/composition/CompositionTimelineLayerProperty";
import { connectActionState } from "~/state/stateUtils";

interface OwnProps {
	id: string;
	compositionId: string;
}
interface StateProps {
	layer: CompositionLayer;
}
type Props = OwnProps & StateProps;

const CompositionTimelineLayerComponent: React.FC<Props> = (props) => {
	const s = useStylesheet(styles);
	const { layer } = props;

	return (
		<>
			<div className={s("container")}>
				<div className={s("label")}>{layer.name}</div>
			</div>
			{layer.properties.map((propertyId, i) => {
				return (
					<CompositionTimelineLayerProperty
						compositionId={props.compositionId}
						id={propertyId}
						key={i}
					/>
				);
			})}
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ compositions }, { id }) => ({
	layer: compositions.layers[id],
});

export const CompositionTimelineLayer = connectActionState(mapStateToProps)(
	CompositionTimelineLayerComponent,
);
