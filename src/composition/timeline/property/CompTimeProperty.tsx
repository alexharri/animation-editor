import React from "react";
import { StopwatchIcon } from "~/components/icons/StopwatchIcon";
import { CompositionProperty, CompositionPropertyGroup } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import styles from "~/composition/timeline/property/CompTimeProperty.styles";
import { CompTimePropertyValue } from "~/composition/timeline/property/value/CompTimePropertyValue";
import {
	getLayerPropertyGroupLabel,
	getLayerPropertyLabel,
} from "~/composition/util/compositionPropertyUtils";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { requestAction } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { ValueType } from "~/types";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	id: string;
	depth: number;
}
interface StateProps {
	property: CompositionProperty | CompositionPropertyGroup;
	isSelected: boolean;
}
type Props = OwnProps & StateProps;

const CompTimeLayerPropertyComponent: React.FC<Props> = (props) => {
	const { property } = props;

	const marginLeft = 24 + props.depth * 20;

	if (property.type === "group") {
		const { properties } = property;

		const toggleGroupOpen = () => {
			requestAction({ history: true }, (params) => {
				params.dispatch(
					compositionActions.setPropertyGroupCollapsed(property.id, !property.collapsed),
				);
				params.submitAction("Toggle property group collapsed");
			});
		};

		return (
			<>
				<div className={s("container")}>
					<div className={s("contentContainer")} style={{ marginLeft }}>
						<div
							className={s("collapsedArrow", { open: !property.collapsed })}
							onMouseDown={(e) => e.stopPropagation()}
							onClick={toggleGroupOpen}
						/>
						<div
							className={s("name", {
								active: props.isSelected,
							})}
							onMouseDown={separateLeftRightMouse({
								left: (e) =>
									compTimeHandlers.onPropertyNameMouseDown(
										e,
										props.compositionId,
										property.id,
									),
							})}
						>
							{getLayerPropertyGroupLabel(property.name)}
						</div>
					</div>
				</div>
				{!property.collapsed &&
					properties.map((id) => (
						<CompTimeLayerProperty
							compositionId={props.compositionId}
							id={id}
							key={id}
							depth={props.depth + 1}
						/>
					))}
			</>
		);
	}

	return (
		<div className={s("container")}>
			<div className={s("contentContainer")} style={{ marginLeft }}>
				<div
					className={s("timelineIcon", { active: !!property.timelineId })}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							compTimeHandlers.onPropertyKeyframeIconMouseDown(
								e,
								props.compositionId,
								property.id,
								property.timelineId,
							),
					})}
					style={
						property.valueType === ValueType.Color
							? { pointerEvents: "none", opacity: "0" }
							: {}
					}
				>
					<StopwatchIcon />
				</div>
				<div
					className={s("name", {
						active: props.isSelected,
					})}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							compTimeHandlers.onPropertyNameMouseDown(
								e,
								props.compositionId,
								property.id,
							),
					})}
				>
					{getLayerPropertyLabel(property.name)}
				</div>
				<CompTimePropertyValue propertyId={property.id} />
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState },
	{ id, compositionId },
) => {
	const property = compositionState.properties[id] as CompositionProperty;
	const compositionSelection = getCompSelectionFromState(
		compositionId,
		compositionSelectionState,
	);
	const isSelected = !!compositionSelection.properties[id];

	return {
		isSelected,
		property,
	};
};

export const CompTimeLayerProperty = connectActionState(mapStateToProps)(
	CompTimeLayerPropertyComponent,
);
