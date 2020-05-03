import React, { useRef } from "react";
import { StopwatchIcon } from "~/components/icons/StopwatchIcon";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/composition/timeline/CompositionTimelineLayerProperty.styles";
import { CompositionLayerProperty, Composition } from "~/composition/compositionTypes";
import { connectActionState } from "~/state/stateUtils";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import { compositionActions } from "~/composition/state/compositionReducer";
import { separateLeftRightMouse } from "~/util/mouse";
import { NumberInput } from "~/components/common/NumberInput";
import { Timeline, TimelineKeyframe } from "~/timeline/timelineTypes";
import { getTimelineValueAtIndex, splitKeyframesAtIndex } from "~/timeline/timelineUtils";
import { timelineActions } from "~/timeline/timelineActions";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	compositionId: string;
	id: string;
}
interface StateProps {
	property: CompositionLayerProperty;
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

	const onNameMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			if (isKeyDown("Shift")) {
				dispatch(compositionActions.togglePropertySelection(props.compositionId, props.id));
				submitAction("Toggle selection");
			} else {
				dispatch(compositionActions.clearPropertySelection(props.compositionId));
				dispatch(compositionActions.togglePropertySelection(props.compositionId, props.id));
				submitAction("Select property");
			}
		});
	};

	const value = timeline
		? getTimelineValueAtIndex(timeline, composition.frameIndex)
		: property.value;

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
						onChange={onValueChange}
						onChangeEnd={onValueChangeEnd}
						value={value}
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
	const property = compositions.properties[id];
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
