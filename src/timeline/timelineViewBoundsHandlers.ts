import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { areaActions } from "~/area/state/areaActions";
import {
	timelineEditorAreaActions,
	TimelineEditorAreaState,
} from "~/timeline/timelineEditorAreaState";
import { getAreaActionState } from "~/state/stateUtils";
import { transformGlobalToTimelinePosition } from "~/timeline/timelineUtils";
import { Timeline } from "~/timeline/timelineTypes";

export const timelineViewBoundsHandlers = {
	onLeftHandleMouseDown: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		e.preventDefault();

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const { viewBounds } = getAreaActionState<TimelineEditorAreaState>(areaId);
			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);

				let t = pos.subX(viewport.left).x / viewport.width;

				t = Math.min(t, viewBounds[1]);
				t = Math.max(t, 0);

				dispatch(
					areaActions.dispatchToAreaState(
						areaId,
						timelineEditorAreaActions.setViewBounds([t, viewBounds[1]]),
					),
				);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},

	onRightHandleMouseDown: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		e.preventDefault();

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const { viewBounds } = getAreaActionState<TimelineEditorAreaState>(areaId);

			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);

				let t = pos.subX(viewport.left).x / viewport.width;

				t = Math.max(t, viewBounds[0]);
				t = Math.min(t, 1);

				dispatch(
					areaActions.dispatchToAreaState(
						areaId,
						timelineEditorAreaActions.setViewBounds([viewBounds[0], t]),
					),
				);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},

	/**
	 * When the user moves the viewBounds bar around
	 */
	onMoveViewBounds: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		e.preventDefault();

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const { viewBounds } = getAreaActionState<TimelineEditorAreaState>(areaId);

			let initialT = Vec2.fromEvent(e).subX(viewport.left).x / viewport.width;

			initialT = Math.max(initialT, viewBounds[0]);
			initialT = Math.min(initialT, 1);

			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);

				let t = pos.subX(viewport.left).x / viewport.width;

				const tChange = t - initialT;

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
						timelineEditorAreaActions.setViewBounds(newBounds),
					),
				);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},

	/**
	 * When the user Space + Mouse drags the timeline around
	 */
	onPanViewBounds: (
		e: React.MouseEvent,
		areaId: string,
		options: { timeline: Timeline; viewport: Rect; viewBounds: [number, number] },
	) => {
		e.preventDefault();

		const fn: RequestActionCallback = ({ addListener, submitAction, dispatch }) => {
			const { timeline, viewBounds } = options;

			const initialPos = transformGlobalToTimelinePosition(Vec2.fromEvent(e), options);
			let initialT = initialPos.x / timeline.length;

			addListener.repeated("mousemove", (e) => {
				const pos = transformGlobalToTimelinePosition(Vec2.fromEvent(e), options);

				const t = pos.x / timeline.length;

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
						timelineEditorAreaActions.setViewBounds(newBounds),
					),
				);
			});

			addListener.once("mouseup", () => submitAction());
		};
		requestAction({ history: false }, fn);
	},
};
