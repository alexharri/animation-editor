import React from "react";

import { StopwatchIcon } from "~/components/icons/StopwatchIcon";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import {
	CompositionProperty,
	Composition,
	PropertyToValueMap,
} from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { Timeline } from "~/timeline/timelineTypes";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { CompTimePropertyName } from "~/composition/timeline/property/common/CompTimePropertyName";
import styles from "~/composition/timeline/property/CompTimeProperty.styles";
import { CompTimePropertyValue } from "~/composition/timeline/property/value/CompTimePropertyValue";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	propertyId: string;
	propertyToValue: PropertyToValueMap;
	depth: number;
}
interface StateProps {
	property: CompositionProperty;
	isSelected: boolean;
	composition: Composition;
	timeline?: Timeline;
}
type Props = OwnProps & StateProps;

const CompTimeColorPropertyComponent: React.FC<Props> = (props) => {
	const { property } = props;

	return (
		<div className={s("container")}>
			<div className={s("contentContainer")} style={{ marginLeft: 16 + props.depth * 16 }}>
				<div
					className={s("timelineIcon", { active: !!property.timelineId })}
					onMouseDown={separateLeftRightMouse({
						left: () =>
							compTimeHandlers.onPropertyKeyframeIconMouseDown(
								props.compositionId,
								property.id,
								property.timelineId,
							),
					})}
				>
					<StopwatchIcon />
				</div>
				<CompTimePropertyName propertyId={props.propertyId} />
				<CompTimePropertyValue propertyId={props.propertyId} />
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ timelines, compositions, compositionSelection },
	{ propertyId, compositionId },
) => {
	const composition = compositions.compositions[compositionId];
	const property = compositions.properties[propertyId] as CompositionProperty;
	const isSelected = !!compositionSelection.properties[propertyId];

	const timeline = property.timelineId ? timelines[property.timelineId] : undefined;

	return {
		composition,
		timeline,
		isSelected,
		property,
	};
};

export const CompTimeColorProperty = connectActionState(mapStateToProps)(
	CompTimeColorPropertyComponent,
);
