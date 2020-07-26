import React, { useContext } from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { CompTimePropertyColorValue } from "~/composition/timeline/property/value/CompTimePropertyColorValue";
import { CompTimePropertyNumberValue } from "~/composition/timeline/property/value/CompTimePropertyNumberValue";
import { CompositionPropertyValuesContext } from "~/shared/property/computeCompositionPropertyValues";
import { connectActionState } from "~/state/stateUtils";
import { RGBAColor, ValueType } from "~/types";

interface OwnProps {
	propertyId: string;
}
interface StateProps {
	valueType: ValueType;
}
type Props = OwnProps & StateProps;

const CompTimePropertyValueComponent: React.FC<Props> = (props) => {
	const propertyToValue = useContext(CompositionPropertyValuesContext);

	const value = propertyToValue[props.propertyId];

	if (props.valueType === ValueType.Color) {
		return (
			<CompTimePropertyColorValue
				propertyId={props.propertyId}
				value={value.computedValue as RGBAColor}
			/>
		);
	}

	if (props.valueType === ValueType.Number) {
		return (
			<CompTimePropertyNumberValue
				propertyId={props.propertyId}
				computedValue={value.computedValue as number}
				rawValue={value.rawValue as number}
			/>
		);
	}

	return null;
};

const mapState: MapActionState<StateProps, OwnProps> = (
	{ compositionState: compositions },
	{ propertyId },
) => ({
	valueType: (compositions.properties[propertyId] as CompositionProperty).valueType,
});

export const CompTimePropertyValue = connectActionState(mapState)(CompTimePropertyValueComponent);
