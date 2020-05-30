import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import { capToRange, interpolate } from "~/util/math";
import { animate } from "~/util/animation/animate";
import { areaActions } from "~/area/state/areaActions";
import { compositionTimelineAreaActions } from "~/composition/timeline/compositionTimelineAreaReducer";
import {
	transformGlobalToTimelineX,
	getTimelineValueAtIndex,
	createTimelineForLayerProperty,
} from "~/timeline/timelineUtils";
import { Composition } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";
import { getActionState } from "~/state/stateUtils";
import { timelineActions } from "~/timeline/timelineActions";

const ZOOM_FAC = 0.25;

export const compositionTimelineHandlers = {
	onScrubMouseDown: (
		e: React.MouseEvent,
		options: {
			composition: Composition;
			viewBounds: [number, number];
			viewport: Rect;
		},
	) => {
		e.preventDefault();

		const { composition, viewport, viewBounds } = options;

		const fn: RequestActionCallback = (params) => {
			const { addListener, dispatch, submitAction } = params;

			const onMove = (e: MouseEvent | React.MouseEvent) => {
				const pos = Vec2.fromEvent(e);
				const x = transformGlobalToTimelineX(
					pos.x,
					viewBounds,
					viewport.left,
					viewport.width,
					composition.length,
				);
				dispatch(
					compositionActions.setFrameIndex(
						composition.id,
						capToRange(0, composition.length - 1, Math.round(x)),
					),
				);
			};
			addListener.repeated("mousemove", onMove);
			onMove(e);

			addListener.once("mouseup", () => {
				submitAction("Move scrubber");
			});
		};
		requestAction({ history: true }, fn);
	},

	onZoomClick: (
		e: React.MouseEvent,
		areaId: string,
		options: {
			viewBounds: [number, number];
			width: number;
			left: number;
		},
	) => {
		const { viewBounds, width, left } = options;

		const mousePos = Vec2.fromEvent(e).subX(left);
		const t = mousePos.x / width;

		let newBounds: [number, number];

		if (isKeyDown("Alt")) {
			const add = Math.abs(viewBounds[0] - viewBounds[1]) * ZOOM_FAC;
			newBounds = [
				capToRange(0, 1, viewBounds[0] - add * t),
				capToRange(0, 1, viewBounds[1] + add * (1 - t)),
			];
		} else {
			const remove = Math.abs(viewBounds[0] - viewBounds[1]) * ZOOM_FAC;
			newBounds = [viewBounds[0] + remove * t, viewBounds[1] - remove * (1 - t)];
		}

		requestAction({ history: false }, ({ dispatch, submitAction }) => {
			animate({ duration: 0 }, (t) => {
				dispatch(
					areaActions.dispatchToAreaState(
						areaId,
						compositionTimelineAreaActions.setViewBounds([
							interpolate(viewBounds[0], newBounds[0], t),
							interpolate(viewBounds[1], newBounds[1], t),
						]),
					),
				);
			}).then(() => submitAction());
		});
	},

	/**
	 * When the user Space + Mouse drags the timeline around
	 */
	onPanViewBounds: (
		e: React.MouseEvent,
		areaId: string,
		options: {
			length: number;
			viewBounds: [number, number];
			width: number;
			left: number;
		},
	) => {
		e.preventDefault();

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const { viewBounds, length, width, left } = options;

			const initialPos = transformGlobalToTimelineX(
				Vec2.fromEvent(e).x,
				viewBounds,
				left,
				width,
				length,
			);
			let initialT = initialPos / length;

			addListener.repeated("mousemove", (e) => {
				const pos = transformGlobalToTimelineX(
					Vec2.fromEvent(e).x,
					viewBounds,
					left,
					width,
					length,
				);

				const t = pos / length;

				const tChange = (t - initialT) * -1;

				const rightShiftMax = 1 - viewBounds[1];
				const leftShiftMax = -viewBounds[0];

				let newBounds = [viewBounds[0], viewBounds[1]] as [number, number];
				if (tChange > rightShiftMax) {
					newBounds[1] = 1;
					newBounds[0] += rightShiftMax;
				} else if (tChange < leftShiftMax) {
					newBounds[0] = 0;
					newBounds[1] += leftShiftMax;
				} else {
					newBounds[0] += tChange;
					newBounds[1] += tChange;
				}

				dispatch(
					areaActions.dispatchToAreaState(
						areaId,
						compositionTimelineAreaActions.setViewBounds(newBounds),
					),
				);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},

	onPropertyKeyframeIconMouseDown: (
		compositionId: string,
		propertyId: string,
		timelineId: string,
	) => {
		const { compositions, timelines, timelineSelection } = getActionState();
		const composition = compositions.compositions[compositionId];
		const property = compositions.properties[propertyId];

		if (timelineId) {
			// Delete timeline and make the value of the timeline at the current time
			// the value of the property
			const timeline = timelines[timelineId];
			const value = getTimelineValueAtIndex(
				composition.frameIndex,
				timeline,
				timelineSelection[timeline.id],
			);

			requestAction({ history: true }, ({ dispatch, submitAction }) => {
				dispatch(timelineActions.removeTimeline(timelineId));
				dispatch(compositionActions.setPropertyValue(propertyId, value));
				dispatch(compositionActions.setPropertyTimelineId(propertyId, ""));
				submitAction("Remove timeline from property");
			});
			return;
		}

		// Create timeline with a single keyframe at the current time
		requestAction({ history: true }, ({ dispatch, submitAction }) => {
			const timeline = createTimelineForLayerProperty(property.value, composition.frameIndex);
			dispatch(timelineActions.setTimeline(timeline.id, timeline));
			dispatch(compositionActions.setPropertyTimelineId(propertyId, timeline.id));
			submitAction("Add timeline to property");
		});
	},

	onMouseDownOut: (
		e: React.MouseEvent,
		ref: React.RefObject<HTMLDivElement>,
		compositionId: string,
	) => {
		if (e.target !== ref.current) {
			return;
		}

		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;
			dispatch(compositionActions.clearCompositionSelection(compositionId));
			submitAction("Clear selection");
		});
	},

	onLayerNameMouseDown: (e: React.MouseEvent, compositionId: string, propertyId: string) => {
		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			if (isKeyDown("Command")) {
				dispatch(compositionActions.toggleLayerSelection(compositionId, propertyId));
				submitAction("Toggle selection");
			} else {
				dispatch(compositionActions.clearCompositionSelection(compositionId));
				dispatch(compositionActions.toggleLayerSelection(compositionId, propertyId));
				submitAction("Select property");
			}
		});
	},

	onPropertyNameMouseDown: (e: React.MouseEvent, compositionId: string, propertyId: string) => {
		e.preventDefault();
		requestAction({ history: true }, (params) => {
			const { dispatch, submitAction } = params;

			if (isKeyDown("Command")) {
				dispatch(compositionActions.togglePropertySelection(compositionId, propertyId));
				submitAction("Toggle selection");
			} else {
				dispatch(compositionActions.clearCompositionSelection(compositionId));
				dispatch(compositionActions.togglePropertySelection(compositionId, propertyId));
				submitAction("Select property");
			}
		});
	},
};
