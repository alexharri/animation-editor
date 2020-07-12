import React from "react";
import { StopwatchIcon } from "~/components/icons/StopwatchIcon";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import {
	CompositionProperty,
	Composition,
	CompositionPropertyGroup,
} from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { separateLeftRightMouse } from "~/util/mouse";
import { Timeline } from "~/timeline/timelineTypes";
import styles from "~/composition/timeline/property/CompTimeProperty.styles";
import { compTimeHandlers } from "~/composition/timeline/compTimeHandlers";
import {
	getLayerPropertyLabel,
	getLayerPropertyGroupLabel,
} from "~/composition/util/compositionPropertyUtils";
import { requestAction } from "~/listener/requestAction";
import { compositionActions } from "~/composition/state/compositionReducer";
import { CompTimePropertyValue } from "~/composition/timeline/property/value/CompTimePropertyValue";
import { ValueType } from "~/types";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	id: string;
	depth: number;
}
interface StateProps {
	property: CompositionProperty | CompositionPropertyGroup;
	isSelected: boolean;
	composition: Composition;
	timeline?: Timeline;
}
type Props = OwnProps & StateProps;

const CompTimeLayerPropertyComponent: React.FC<Props> = (props) => {
	const { property } = props;

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
					<div
						className={s("contentContainer")}
						style={{ marginLeft: 16 + props.depth * 16 }}
					>
						<div
							className={s("collapsedArrow", { open: !property.collapsed })}
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
			<div className={s("contentContainer")} style={{ marginLeft: 16 + props.depth * 16 }}>
				<div
					className={s("timelineIcon", { active: !!property.timelineId })}
					onMouseDown={separateLeftRightMouse({
						left: () =>
							compTimeHandlers.onPropertyKeyframeIconMouseDown(
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
	{ timelines, compositions, compositionSelection },
	{ id, compositionId },
) => {
	const composition = compositions.compositions[compositionId];
	const property = compositions.properties[id] as CompositionProperty;
	const isSelected = !!compositionSelection.properties[id];

	const timeline = property.timelineId ? timelines[property.timelineId] : undefined;

	return {
		composition,
		timeline,
		isSelected,
		property,
	};
};

export const CompTimeLayerProperty = connectActionState(mapStateToProps)(
	CompTimeLayerPropertyComponent,
);
