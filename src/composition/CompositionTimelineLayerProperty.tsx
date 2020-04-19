import React from "react";

import { StopwatchIcon } from "~/components/icons/StopwatchIcon";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/composition/timeline/CompositionTimelineLayerProperty.styles";
import { CompositionLayerProperty } from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { requestAction } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import { compositionActions } from "~/composition/state/compositionReducer";
import { separateLeftRightMouse } from "~/util/mouse";
import { NumberInput } from "~/components/common/NumberInput";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	id: string;
}
interface StateProps {
	property: CompositionLayerProperty;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompositionTimelineLayerPropertyComponent: React.FC<Props> = (props) => {
	const { property } = props;

	const onNameMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			if (isKeyDown("Shift")) {
				dispatch(compositionActions.togglePropertySelection(props.id));
				submitAction("Toggle selection");
			} else {
				dispatch(compositionActions.clearPropertySelection());
				dispatch(compositionActions.togglePropertySelection(props.id));
				submitAction("Select property");
			}
		});
	};

	return (
		<>
			<div className={s("container")}>
				<div
					className={s("timelineIcon", { active: !!property.timelineId })}
					// onMouseDown={this.onStopwatchMouseDown}
				>
					<StopwatchIcon />
				</div>
				<div
					className={s("name", {
						active: props.isSelected,
					})}
					onMouseDown={separateLeftRightMouse({
						left: (e) => onNameMouseDown(e),
					})}
					// onClick={timelineId ? () => this.props.setTimelineId(timelineId) : undefined}
				>
					{property.name}
				</div>
				<div className={s("value")}>
					<NumberInput
						// onChange={this.onValueChange}
						// onChangeEnd={this.onValueChangeEnd}
						onChange={(v) => console.log(v)}
						value={property.value}
					/>
				</div>
			</div>
		</>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = ({ compositions }, { id }) => {
	const property = compositions.properties[id];
	const isSelected = !!compositions.selection.properties[id];
	return { isSelected, property };
};

export const CompositionTimelineLayerProperty = connectActionState(mapStateToProps)(
	CompositionTimelineLayerPropertyComponent,
);
