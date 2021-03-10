import React, { useContext, useEffect, useState } from "react";
import { Property } from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { TimelinePropertyStoreContext } from "~/timeline/context/TimelineValueContext";
import { TimelinePropertyColorValue } from "~/timeline/value/TimelineColorValue";
import { TimelineNumberValue } from "~/timeline/value/TimelineNumberValue";
import { TimelineSelectValue } from "~/timeline/value/TimelineSelectValue";
import { FillRule, LineCap, LineJoin, OriginBehavior, TransformBehavior, ValueType } from "~/types";

interface OwnProps {
	propertyId: string;
}
interface StateProps {
	valueType: ValueType;
}
type Props = OwnProps & StateProps;

const TimelineValueComponent: React.FC<Props> = (props) => {
	const { propertyId } = props;

	const propertyStore = useContext(TimelinePropertyStoreContext);

	const [[rawValue, computedValue], setValues] = useState<[any, any]>(() => [
		propertyStore.getRawPropertyValue(propertyId),
		propertyStore.getPropertyValue(propertyId),
	]);

	useEffect(() => {
		const id = propertyStore.addListener(propertyId, (computedValue, rawValue) =>
			setValues([rawValue, computedValue]),
		);
		return () => propertyStore.removeListener(propertyId, id);
	}, [propertyStore]);

	if (props.valueType === ValueType.RGBAColor) {
		return <TimelinePropertyColorValue propertyId={props.propertyId} value={computedValue} />;
	}

	if (props.valueType === ValueType.Number) {
		return (
			<TimelineNumberValue
				propertyId={props.propertyId}
				computedValue={computedValue as number}
				rawValue={rawValue as number}
			/>
		);
	}

	if (props.valueType === ValueType.TransformBehavior) {
		return (
			<TimelineSelectValue<TransformBehavior>
				propertyId={props.propertyId}
				value={rawValue}
				actionName=""
				options={[
					{ value: "absolute_for_computed", label: "Default" },
					{ value: "recursive", label: "Recursive" },
				]}
			/>
		);
	}

	if (props.valueType === ValueType.OriginBehavior) {
		return (
			<TimelineSelectValue<OriginBehavior>
				propertyId={props.propertyId}
				value={rawValue}
				actionName=""
				options={[
					{ value: "relative", label: "Relative" },
					{ value: "absolute", label: "Absolute" },
				]}
			/>
		);
	}

	if (props.valueType === ValueType.LineJoin) {
		return (
			<TimelineSelectValue<LineJoin>
				propertyId={props.propertyId}
				value={rawValue}
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
				value={rawValue}
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
				value={rawValue}
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
	valueType: (compositions.properties[propertyId] as Property).valueType,
});

export const TimelineValue = connectActionState(mapState)(TimelineValueComponent);
