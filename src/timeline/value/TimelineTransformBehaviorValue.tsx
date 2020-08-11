import React from "react";
import { compositionActions } from "~/composition/compositionReducer";
import { requestAction } from "~/listener/requestAction";
import TimelinePropertyStyles from "~/timeline/property/TimelineProperty.styles";
import { TransformBehavior } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(TimelinePropertyStyles);

interface OwnProps {
	propertyId: string;
	value: TransformBehavior;
}
interface StateProps {}
type Props = OwnProps & StateProps;

export const TimelineTransformBehaviorValue: React.FC<Props> = (props) => {
	const { propertyId } = props;

	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value as TransformBehavior;
		requestAction({ history: true }, (params) => {
			params.dispatch(compositionActions.setPropertyValue(propertyId, value));
			params.submitAction("Set transform behavior");
		});
	};

	const behaviors: Array<{ label: string; value: TransformBehavior }> = [
		{ value: "absolute_for_computed", label: "Default" },
		{ value: "recursive", label: "Recursive" },
	];

	return (
		<div className={s("value")}>
			<select value={props.value} onChange={onChange} className={s("select")}>
				{behaviors.map(({ label, value }) => (
					<option key={value} value={value}>
						{label}
					</option>
				))}
			</select>
		</div>
	);
};
