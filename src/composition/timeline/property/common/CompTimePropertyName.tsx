import React from "react";
import { separateLeftRightMouse } from "~/util/mouse";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import CompTimePropertyStyles from "~/composition/timeline/property/CompTimeProperty.styles";
import { getLayerPropertyLabel } from "~/composition/util/compositionPropertyUtils";
import { CompositionProperty } from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { PropertyName } from "~/types";

const s = compileStylesheetLabelled(CompTimePropertyStyles);

interface OwnProps {
	propertyId: string;
}
interface StateProps {
	compositionId: string;
	selected: boolean;
	name: PropertyName;
}
type Props = OwnProps & StateProps;

const CompTimePropertyNameComponent: React.FC<Props> = (props) => {
	return (
		<div
			className={s("name", {
				active: props.selected,
			})}
			onMouseDown={separateLeftRightMouse({
				left: (e) =>
					compTimeHandlers.onPropertyNameMouseDown(
						e,
						props.compositionId,
						props.propertyId,
					),
			})}
		>
			{getLayerPropertyLabel(props.name)}
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositions, compositionSelection },
	{ propertyId },
) => {
	const selected = !!compositionSelection.properties[propertyId];
	const { name, compositionId } = compositions.properties[propertyId] as CompositionProperty;

	return {
		compositionId,
		name,
		selected,
	};
};

export const CompTimePropertyName = connectActionState(mapState)(CompTimePropertyNameComponent);
