import React from "react";
import { useStylesheet } from "~/util/stylesheets";
import { CompositionLayer } from "~/composition/compositionTypes";
import styles from "~/composition/timeline/CompositionTimelineLayer.style";
import { CompositionTimelineLayerProperty } from "~/composition/timeline/CompositionTimelineLayerProperty";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { compositionTimelineHandlers } from "~/composition/timeline/compositionTimelineHandlers";
import { GraphIcon } from "~/components/icons/GraphIcon";

interface OwnProps {
	id: string;
	compositionId: string;
}
interface StateProps {
	layer: CompositionLayer;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompositionTimelineLayerComponent: React.FC<Props> = (props) => {
	const s = useStylesheet(styles);
	const { layer } = props;

	return (
		<>
			<div className={s("container")}>
				<div
					className={s("name", { active: props.isSelected })}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							compositionTimelineHandlers.onLayerNameMouseDown(
								e,
								props.compositionId,
								layer.id,
							),
					})}
				>
					{layer.name}
				</div>
				<div className={s("graph")}>
					<GraphIcon />
				</div>
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

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositions, compositionSelection },
	{ id },
) => {
	return {
		layer: compositions.layers[id],
		isSelected: !!compositionSelection.layers[id],
	};
};

export const CompositionTimelineLayer = connectActionState(mapStateToProps)(
	CompositionTimelineLayerComponent,
);
