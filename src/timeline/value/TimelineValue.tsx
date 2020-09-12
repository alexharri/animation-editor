import React, { useContext, useEffect, useState } from "react";
import { CompositionProperty } from "~/composition/compositionTypes";
import { CompositionPropertyValuesContext } from "~/shared/composition/compositionRenderValues";
import { connectActionState } from "~/state/stateUtils";
import { TimelinePropertyColorValue } from "~/timeline/value/TimelineColorValue";
import { TimelineNumberValue } from "~/timeline/value/TimelineNumberValue";
import { TimelineSelectValue } from "~/timeline/value/TimelineSelectValue";
import { FillRule, LineCap, LineJoin, RGBColor, TransformBehavior, ValueType } from "~/types";

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

	if (props.valueType === ValueType.RGBColor) {
		return (
			<TimelinePropertyColorValue
				propertyId={props.propertyId}
				value={value.computedValue as RGBColor}
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
			<TimelineSelectValue<TransformBehavior>
				propertyId={props.propertyId}
				value={value.rawValue}
				actionName=""
				options={[
					{ value: "absolute_for_computed", label: "Default" },
					{ value: "recursive", label: "Recursive" },
				]}
			/>
		);
	}

	if (props.valueType === ValueType.LineJoin) {
		return (
			<TimelineSelectValue<LineJoin>
				propertyId={props.propertyId}
				value={value.rawValue}
				actionName="Set line join"
				options={[
					{ value: "bevel", label: "Bevel" },
					{ value: "round", label: "Round" },
					{ value: "miter", label: "Miter" },
				]}
			/>
		);
	}

	if (props.valueType === ValueType.LineCap) {
		return (
			<TimelineSelectValue<LineCap>
				propertyId={props.propertyId}
				value={value.rawValue}
				actionName="Set line cap"
				options={[
					{ value: "butt", label: "Butt" },
					{ value: "round", label: "Round" },
					{ value: "square", label: "Square" },
				]}
			/>
		);
	}

	if (props.valueType === ValueType.FillRule) {
		return (
			<TimelineSelectValue<FillRule>
				propertyId={props.propertyId}
				value={value.rawValue}
				actionName="Set fill rule"
				options={[
					{ value: "evenodd", label: "Even-Odd" },
					{ value: "nonzero", label: "Non-Zero" },
				]}
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

export const TimelineValue = connectActionState(mapState)(TimelineValueComponent);
