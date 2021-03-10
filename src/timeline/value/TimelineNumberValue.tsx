import React, { useRef } from "react";
import { NumberInput } from "~/components/common/NumberInput";
import { LinkIcon } from "~/components/icons/LinkIcon";
import { compositionActions } from "~/composition/compositionReducer";
import { Composition, CompoundProperty, Property } from "~/composition/compositionTypes";
import { DiffFactoryFn } from "~/diff/diffFactory";
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
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const usePropertyNumberInput = (
	property: Property,
	compoundProperty: CompoundProperty | null,
	composition: Composition,
) => {
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

			let otherPropertyId = "";

			if (compoundProperty && compoundProperty.maintainProportions) {
				const { compositionState } = getActionState();
				otherPropertyId = compoundProperty.properties.find((id) => {
					const p = compositionState.properties[id] as Property;
					return p.id !== property.id;
				})!;
			}

			const diffFn: DiffFactoryFn = (diff) =>
				otherPropertyId
					? diff.modifyMultipleLayerProperties([property.id, otherPropertyId])
					: diff.modifyProperty(property.id);

			if (otherPropertyId) {
				const {
					compositionState,
					timelineState,
					timelineSelectionState,
				} = getActionState();

				const twinProperty = compositionState.properties[otherPropertyId] as Property;
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
				const op = createOperation(params);
				const { compositionState, timelineState } = getActionState();

				const update = (propertyId: string, value: number) => {
					const property = compositionState.properties[propertyId] as Property;
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

				if (otherPropertyId) {
					const proportion = proportionRef.current;
					update(otherPropertyId, proportion * value);
				}

				op.performDiff(diffFn);
				op.submit();
			};
			onValueChangeFn.current(value);

			onValueChangeEndFn.current = () => {
				params.addDiff(diffFn);
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
	property: Property;
	composition: Composition;
	compoundProperty: CompoundProperty | null;
}
type Props = OwnProps & StateProps;

const TimelineNumberValueComponent: React.FC<Props> = (props) => {
	const { composition, property, compoundProperty } = props;

	const [onValueChange, onValueChangeEnd] = usePropertyNumberInput(
		property,
		compoundProperty,
		composition,
	);

	return (
		<div className={s("value")}>
			{compoundProperty &&
				compoundProperty.separated &&
				compoundProperty.allowMaintainProportions && (
					<button
						className={s("maintainProportionsButton", {
							active: compoundProperty.maintainProportions,
						})}
						onMouseDown={separateLeftRightMouse({ left: (e) => e.stopPropagation() })}
						onClick={() =>
							timelineHandlers.toggleMaintainPropertyProportions(compoundProperty.id)
						}
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
					property.name === PropertyName.Opacity ||
					property.name === PropertyName.ArrayModifier_RotationCorrection
						? 0.01
						: 1
				}
				decimalPlaces={
					property.name === PropertyName.ScaleX ||
					property.name === PropertyName.ScaleY ||
					property.name === PropertyName.Opacity ||
					property.name === PropertyName.ArrayModifier_RotationCorrection
						? 2
						: 1
				}
			/>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ compositionState },
	{ propertyId },
) => {
	const property = compositionState.properties[propertyId] as Property;
	const composition = compositionState.compositions[property.compositionId];

	let compoundProperty: CompoundProperty | null = null;

	if (property.compoundPropertyId) {
		compoundProperty = compositionState.properties[
			property.compoundPropertyId
		] as CompoundProperty;
	}

	return {
		composition,
		property,
		compoundProperty,
	};
};

export const TimelineNumberValue = connectActionState(mapStateToProps)(
	TimelineNumberValueComponent,
);
