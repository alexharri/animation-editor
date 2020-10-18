import React, { useRef } from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { LinkIcon } from "~/components/icons/LinkIcon";
import { compositionActions } from "~/composition/compositionReducer";
import { Composition, CompositionProperty } from "~/composition/compositionTypes";
import { compSelectionFromState } from "~/composition/util/compSelectionUtils";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { connectActionState, getActionState } from "~/state/stateUtils";
import TimelinePropertyStyles from "~/timeline/property/TimelineProperty.styles";
import { timelineActions } from "~/timeline/timelineActions";
import { timelineHandlers } from "~/timeline/timelineHandlers";
import { TimelineKeyframe } from "~/timeline/timelineTypes";
import {
	createTimelineKeyframe,
	getTimelineValueAtIndex,
	splitKeyframesAtIndex,
} from "~/timeline/timelineUtils";
import { PropertyName } from "~/types";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const usePropertyNumberInput = (property: CompositionProperty, composition: Composition) => {
	const paramsRef = useRef<RequestActionParams | null>(null);
	const proportionRef = useRef(1);
	const onValueChangeFn = useRef<((value: number) => void) | null>(null);
	const onValueChangeEndFn = useRef<(() => void) | null>(null);

	const onValueChange = (value: number): void => {
		if (onValueChangeFn.current) {
			onValueChangeFn.current(value);
			return;
		}

		requestAction({ history: true }, (params) => {
			paramsRef.current = params;

			const updateTwin = property.twinPropertyId && property.shouldMaintainProportions;

			if (updateTwin) {
				const {
					compositionState,
					timelineState,
					timelineSelectionState,
				} = getActionState();
				const twinProperty = compositionState.properties[
					property.twinPropertyId
				] as CompositionProperty;
				const composition = compositionState.compositions[property.compositionId];
				const layer = compositionState.layers[property.layerId];
				const { frameIndex } = composition;
				const { index } = layer;

				const propertyValue = property.timelineId
					? getTimelineValueAtIndex({
							frameIndex,
							layerIndex: index,
							timeline: timelineState[property.timelineId],
							selection: timelineSelectionState[property.timelineId],
					  })
					: property.value;
				const twinValue = twinProperty.timelineId
					? getTimelineValueAtIndex({
							frameIndex,
							layerIndex: index,
							timeline: timelineState[twinProperty.timelineId],
							selection: timelineSelectionState[twinProperty.timelineId],
					  })
					: twinProperty.value;

				const proportion = twinValue / propertyValue;
				proportionRef.current = proportion;
			}

			onValueChangeFn.current = (value) => {
				const op = createOperation();
				const { compositionState, timelineState } = getActionState();

				const update = (propertyId: string, value: number) => {
					const property = compositionState.properties[propertyId] as CompositionProperty;
					const timeline = timelineState[property.timelineId];

					let keyframe: TimelineKeyframe | null = null;

					if (timeline) {
						for (let i = 0; i < timeline.keyframes.length; i += 1) {
							if (timeline.keyframes[i].index === composition.frameIndex) {
								keyframe = timeline.keyframes[i];
							}
						}
					}

					if (!timeline) {
						op.add(compositionActions.setPropertyValue(propertyId, value));
						return;
					}

					if (keyframe) {
						op.add(
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
						op.add(timelineActions.setKeyframe(timeline.id, k));
						return;
					}

					if (index > keyframes[keyframes.length - 1].index) {
						const k = createTimelineKeyframe(value, index);
						op.add(timelineActions.setKeyframe(timeline.id, k));
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
						op.add(timelineActions.setKeyframe(timeline.id, k0));
						op.add(timelineActions.setKeyframe(timeline.id, k));
						op.add(timelineActions.setKeyframe(timeline.id, k1));
					}
				};

				update(property.id, value);

				if (updateTwin) {
					const proportion = proportionRef.current;
					update(property.twinPropertyId, proportion * value);
				}
				params.dispatch(op.actions);
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
}
type Props = OwnProps & StateProps;

const TimelineNumberValueComponent: React.FC<Props> = (props) => {
	const { composition, property } = props;

	const [onValueChange, onValueChangeEnd] = usePropertyNumberInput(property, composition);

	return (
		<div className={s("value")}>
			{property.twinPropertyId && (
				<button
					className={s("maintainProportionsButton", {
						active: property.shouldMaintainProportions,
					})}
					onClick={() => timelineHandlers.toggleMaintainPropertyProportions(property.id)}
				>
					<LinkIcon />
				</button>
			)}
			<NumberInput
				min={property.min}
				max={property.max}
				onChange={onValueChange}
				onChangeEnd={onValueChangeEnd}
				value={props.rawValue}
				showValue={props.computedValue}
				tick={
					property.name === PropertyName.ScaleX ||
					property.name === PropertyName.ScaleY ||
					property.name === PropertyName.Opacity
						? 0.01
						: 1
				}
				decimalPlaces={
					property.name === PropertyName.ScaleX ||
					property.name === PropertyName.ScaleY ||
					property.name === PropertyName.Opacity
						? 2
						: 1
				}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState, compositionSelectionState },
	{ propertyId },
) => {
	const property = compositionState.properties[propertyId] as CompositionProperty;
	const composition = compositionState.compositions[property.compositionId];
	const compositionSelection = compSelectionFromState(composition.id, compositionSelectionState);
	const isSelected = !!compositionSelection.properties[propertyId];

	return {
		composition,
		isSelected,
		property,
	};
};

export const TimelineNumberValue = connectActionState(mapStateToProps)(
	TimelineNumberValueComponent,
);
