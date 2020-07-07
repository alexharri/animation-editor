import React, { useRef } from "react";
import { StopwatchIcon } from "~/components/icons/StopwatchIcon";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import { CompositionProperty, Composition } from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { compositionActions } from "~/composition/state/compositionReducer";
import { separateLeftRightMouse } from "~/util/mouse";
import { NumberInput } from "~/components/common/NumberInput";
import { Timeline, TimelineKeyframe } from "~/timeline/timelineTypes";
import { splitKeyframesAtIndex, createTimelineKeyframe } from "~/timeline/timelineUtils";
import { timelineActions } from "~/timeline/timelineActions";
import styles from "~/composition/timeline/CompositionTimelineProperty.styles";
import { compositionTimelineHandlers } from "~/composition/timeline/compositionTimelineHandlers";
import { getLayerPropertyLabel } from "~/composition/util/compositionPropertyUtils";
import { PropertyName } from "~/types";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	id: string;
	value: number;
}
interface StateProps {
	property: CompositionProperty;
	isSelected: boolean;
	composition: Composition;
	timeline?: Timeline;
}
type Props = OwnProps & StateProps;

const CompositionTimelineLayerPropertyComponent: React.FC<Props> = (props) => {
	const { property, composition, timeline } = props;

	const paramsRef = useRef<RequestActionParams | null>(null);
	const onValueChangeFn = useRef<((value: number) => void) | null>(null);
	const onValueChangeEndFn = useRef<(() => void) | null>(null);

	const onValueChange = (value: number) => {
		if (onValueChangeFn.current) {
			onValueChangeFn.current(value);
			return;
		}

		requestAction({ history: true }, (params) => {
			paramsRef.current = params;

			let keyframe: TimelineKeyframe | null = null;

			if (timeline) {
				for (let i = 0; i < timeline.keyframes.length; i += 1) {
					if (timeline.keyframes[i].index === composition.frameIndex) {
						keyframe = timeline.keyframes[i];
					}
				}
			}

			onValueChangeFn.current = (value) => {
				if (!timeline) {
					params.dispatch(compositionActions.setPropertyValue(property.id, value));
					return;
				}

				if (keyframe) {
					params.dispatch(
						timelineActions.setKeyframe(timeline.id, {
							...keyframe,
							value,
						}),
					);
					return;
				}

				const index = composition.frameIndex;
				const keyframes = timeline.keyframes;

				if (index < keyframes[0].index) {
					const k = createTimelineKeyframe(value, index);
					params.dispatch(timelineActions.setKeyframe(timeline.id, k));
					return;
				}

				if (index > keyframes[keyframes.length - 1].index) {
					const k = createTimelineKeyframe(value, index);
					params.dispatch(timelineActions.setKeyframe(timeline.id, k));
					return;
				}

				for (let i = 0; i < keyframes.length; i += 1) {
					if (keyframes[i].index > index) {
						continue;
					}

					if (keyframes[i].index === index) {
						return keyframes[i].value;
					}

					if (index > keyframes[i + 1].index) {
						continue;
					}

					const [k0, k, k1] = splitKeyframesAtIndex(
						keyframes[i],
						keyframes[i + 1],
						index,
					);
					keyframe = k;
					params.dispatch(timelineActions.setKeyframe(timeline.id, k0));
					params.dispatch(timelineActions.setKeyframe(timeline.id, k));
					params.dispatch(timelineActions.setKeyframe(timeline.id, k1));
				}
			};
			onValueChangeFn.current(value);

			onValueChangeEndFn.current = () => {
				paramsRef.current?.submitAction("Update value");
			};
		});
	};

	const onValueChangeEnd = () => {
		onValueChangeEndFn.current?.();

		paramsRef.current = null;
		onValueChangeFn.current = null;
		onValueChangeEndFn.current = null;
	};

	const value = props.value;

	return (
		<>
			<div className={s("container")}>
				<div
					className={s("timelineIcon", { active: !!property.timelineId })}
					onMouseDown={separateLeftRightMouse({
						left: () =>
							compositionTimelineHandlers.onPropertyKeyframeIconMouseDown(
								props.compositionId,
								property.id,
								property.timelineId,
							),
					})}
				>
					<StopwatchIcon />
				</div>
				<div
					className={s("name", {
						active: props.isSelected,
					})}
					onMouseDown={separateLeftRightMouse({
						left: (e) =>
							compositionTimelineHandlers.onPropertyNameMouseDown(
								e,
								props.compositionId,
								property.id,
							),
					})}
				>
					{getLayerPropertyLabel(property.name)}
				</div>
				<div className={s("value")}>
					<NumberInput
						min={property.min}
						max={property.max}
						onChange={onValueChange}
						onChangeEnd={onValueChangeEnd}
						value={value}
						tick={
							property.name === PropertyName.Scale ||
							property.name === PropertyName.Opacity
								? 0.01
								: 1
						}
					/>
				</div>
			</div>
		</>
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

export const CompositionTimelineLayerProperty = connectActionState(mapStateToProps)(
	CompositionTimelineLayerPropertyComponent,
);
