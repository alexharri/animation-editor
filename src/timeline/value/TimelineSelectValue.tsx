import React from "react";
import { compositionActions } from "~/composition/compositionReducer";
import { requestAction } from "~/listener/requestAction";
import { getActionState } from "~/state/stateUtils";
import TimelinePropertyStyles from "~/timeline/property/TimelineProperty.styles";
import { TransformBehavior } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(TimelinePropertyStyles);

interface OwnProps<T> {
	propertyId: string;
	value: TransformBehavior;
	options: Array<{
		value: T;
		label: string;
	}>;
	actionName: string;
}
interface StateProps {}
type Props<T> = OwnProps<T> & StateProps;

export function TimelineSelectValue<T extends string>(props: Props<T>) {
	const { propertyId } = props;

	const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value as TransformBehavior;
		requestAction({ history: true }, (params) => {
			const { compositionState } = getActionState();
			const property = compositionState.properties[propertyId];
			params.dispatch(compositionActions.setPropertyValue(propertyId, value));
			params.addDiff((diff) => diff.modifyProperty(property.id));
			params.submitAction(props.actionName);
		});
	};

	return (
		<div className={s("value")}>
			<select
				value={props.value}
				onChange={onChange}
				className={s("select")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => e.stopPropagation(),
				})}
			>
				{props.options.map(({ label, value }) => (
					<option key={value} value={value}>
						{label}
					</option>
				))}
			</select>
		</div>
	);
}
