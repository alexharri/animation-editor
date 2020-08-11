import React, { useContext, useEffect, useState } from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionPropertyValuesContext } from "~/shared/composition/compositionRenderValues";
import { connectActionState } from "~/state/stateUtils";
import { TimelinePropertyColorValue } from "~/timeline/value/TimelineColorValue";
import { TimelineNumberValue } from "~/timeline/value/TimelineNumberValue";
import { TimelineTransformBehaviorValue } from "~/timeline/value/TimelineTransformBehaviorValue";
import { RGBAColor, ValueType } from "~/types";

interface OwnProps {
	propertyId: string;
}
interface StateProps {
	valueType: ValueType;
}
type Props = OwnProps & StateProps;

const TimelineValueComponent: React.FC<Props> = (props) => {
	const ctx = useContext(CompositionPropertyValuesContext);

	const [value, setValue] = useState(() => ctx.getValue(props.propertyId));

	useEffect(() => {
		const unsubscribe = ctx.subscribe(props.propertyId, setValue);
		return unsubscribe;
	}, []);

	if (props.valueType === ValueType.Color) {
		return (
			<TimelinePropertyColorValue
				propertyId={props.propertyId}
				value={value.computedValue as RGBAColor}
			/>
		);
	}

	if (props.valueType === ValueType.Number) {
		return (
			<TimelineNumberValue
				propertyId={props.propertyId}
				computedValue={value.computedValue as number}
				rawValue={value.rawValue as number}
			/>
		);
	}

	if (props.valueType === ValueType.TransformBehavior) {
		return (
			<TimelineTransformBehaviorValue propertyId={props.propertyId} value={value.rawValue} />
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

export const TimelineValue = connectActionState(mapState)(TimelineValueComponent);
