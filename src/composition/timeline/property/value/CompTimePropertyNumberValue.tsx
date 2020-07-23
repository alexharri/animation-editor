import React from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { Composition, CompositionProperty } from "~/composition/compositionTypes";
import { usePropertyNumberInput } from "~/composition/hook/usePropertyNumberInput";
import CompTimePropertyStyles from "~/composition/timeline/property/CompTimeProperty.styles";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { connectActionState } from "~/state/stateUtils";
import { Timeline } from "~/timeline/timelineTypes";
import { PropertyName } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(CompTimePropertyStyles);

interface OwnProps {
	propertyId: string;
	rawValue: number;
	computedValue: number;
}
interface StateProps {
	property: CompositionProperty;
	composition: Composition;
	timeline?: Timeline;
}
type Props = OwnProps & StateProps;

const NumberValueComponent: React.FC<Props> = (props) => {
	const { composition, property, timeline } = props;

	const [onValueChange, onValueChangeEnd] = usePropertyNumberInput(
		timeline,
		property,
		composition,
	);

	return (
		<div className={s("value")}>
			<NumberInput
				min={property.min}
				max={property.max}
				onChange={onValueChange}
				onChangeEnd={onValueChangeEnd}
				value={props.rawValue}
				showValue={props.computedValue}
				tick={
					property.name === PropertyName.Scale || property.name === PropertyName.Opacity
						? 0.01
						: 1
				}
				decimalPlaces={
					property.name === PropertyName.Scale || property.name === PropertyName.Opacity
						? 2
						: 1
				}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ timelines, compositionState, compositionSelectionState },
	{ propertyId },
) => {
	const property = compositionState.properties[propertyId] as CompositionProperty;
	const composition = compositionState.compositions[property.compositionId];
	const compositionSelection = getCompSelectionFromState(
		composition.id,
		compositionSelectionState,
	);
	const isSelected = !!compositionSelection.properties[propertyId];

	const timeline = property.timelineId ? timelines[property.timelineId] : undefined;

	return {
		composition,
		timeline,
		isSelected,
		property,
	};
};

export const CompTimePropertyNumberValue = connectActionState(mapStateToProps)(
	NumberValueComponent,
);
