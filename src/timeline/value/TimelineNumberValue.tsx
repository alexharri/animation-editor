import React, { useRef } from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { compositionActions } from "~/composition/compositionReducer";
import { Composition, CompositionProperty } from "~/composition/compositionTypes";
import { getCompSelectionFromState } from "~/composition/util/compSelectionUtils";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import TimelinePropertyStyles from "~/timeline/property/TimelineProperty.styles";
import { timelineActions } from "~/timeline/timelineActions";
import { Timeline, TimelineKeyframe } from "~/timeline/timelineTypes";
import { createTimelineKeyframe, splitKeyframesAtIndex } from "~/timeline/timelineUtils";
import { PropertyName } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const usePropertyNumberInput = (
	timeline: Timeline | undefined,
	property: CompositionProperty,
	composition: Composition,
) => {
	const paramsRef = useRef<RequestActionParams | null>(null);
	const onValueChangeFn = useRef<((value: number) => void) | null>(null);
	const onValueChangeEndFn = useRef<(() => void) | null>(null);

	const onValueChange = (value: number): void => {
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

	const onValueChangeEnd = (_type: "relative" | "absolute") => {
		onValueChangeEndFn.current?.();

		paramsRef.current = null;
		onValueChangeFn.current = null;
		onValueChangeEndFn.current = null;
	};

	return [onValueChange, onValueChangeEnd] as const;
};

const s = compileStylesheetLabelled(TimelinePropertyStyles);

interface OwnProps {
	propertyId: string;
	rawValue: number;
	computedValue: number;
}
interface StateProps {
	property: CompositionProperty;
	composition: Composition;
	timeline?: Timeline;
}
type Props = OwnProps & StateProps;

const TimelineNumberValueComponent: React.FC<Props> = (props) => {
	const { composition, property, timeline } = props;

	const [onValueChange, onValueChangeEnd] = usePropertyNumberInput(
		timeline,
		property,
		composition,
	);

	return (
		<div className={s("value")}>
			<NumberInput
				min={property.min}
				max={property.max}
				onChange={onValueChange}
				onChangeEnd={onValueChangeEnd}
				value={props.rawValue}
				showValue={props.computedValue}
				tick={
					property.name === PropertyName.Scale || property.name === PropertyName.Opacity
						? 0.01
						: 1
				}
				decimalPlaces={
					property.name === PropertyName.Scale || property.name === PropertyName.Opacity
						? 2
						: 1
				}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ timelines, compositionState, compositionSelectionState },
	{ propertyId },
) => {
	const property = compositionState.properties[propertyId] as CompositionProperty;
	const composition = compositionState.compositions[property.compositionId];
	const compositionSelection = getCompSelectionFromState(
		composition.id,
		compositionSelectionState,
	);
	const isSelected = !!compositionSelection.properties[propertyId];

	const timeline = property.timelineId ? timelines[property.timelineId] : undefined;

	return {
		composition,
		timeline,
		isSelected,
		property,
	};
};

export const TimelineNumberValue = connectActionState(mapStateToProps)(
	TimelineNumberValueComponent,
);
