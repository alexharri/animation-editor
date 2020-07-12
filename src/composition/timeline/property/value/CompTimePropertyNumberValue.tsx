import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { CompositionProperty, Composition } from "~/composition/compositionTypes";
import { Timeline } from "~/timeline/timelineTypes";
import { usePropertyNumberInput } from "~/composition/hook/usePropertyNumberInput";
import { NumberInput } from "~/components/common/NumberInput";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import CompTimePropertyStyles from "~/composition/timeline/property/CompTimeProperty.styles";
import { PropertyName } from "~/types";

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
	{ timelines, compositions, compositionSelection },
	{ propertyId },
) => {
	const property = compositions.properties[propertyId] as CompositionProperty;
	const composition = compositions.compositions[property.compositionId];
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
