import { splitKeyframesAtIndex, createTimelineKeyframe } from "~/timeline/timelineUtils";
import { timelineActions } from "~/timeline/timelineActions";
import { useRef } from "react";
import { RequestActionParams, requestAction } from "~/listener/requestAction";
import { TimelineKeyframe, Timeline } from "~/timeline/timelineTypes";
import { Composition, CompositionProperty } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";

export const usePropertyNumberInput = (
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
