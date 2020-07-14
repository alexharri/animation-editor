import { ViewBoundsProps } from "~/timeline/ViewBounds";
import { TIMELINE_CANVAS_END_START_BUFFER } from "~/constants";

const MIN_FRAMES_BETWEEN = 24;

export const viewBoundsHandlers = {
	onLeftHandleMouseDown: (_e: React.MouseEvent, props: ViewBoundsProps): void => {
		props.requestUpdate(({ addListener, update, submit }) => {
			const { viewBounds, left, width } = props;
			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);

				const tOfFrame = 1 / props.compositionLength;

				const canvasWidth = width - TIMELINE_CANVAS_END_START_BUFFER * 2;
				const canvasLeft = left + TIMELINE_CANVAS_END_START_BUFFER;

				let t = pos.subX(canvasLeft).x / canvasWidth;

				t = Math.min(t, viewBounds[1] - tOfFrame * MIN_FRAMES_BETWEEN);
				t = Math.max(t, 0);

				update([t, viewBounds[1]]);
			});

			addListener.once("mouseup", () => submit());
		});
	},

	onRightHandleMouseDown: (_e: React.MouseEvent, props: ViewBoundsProps): void => {
		props.requestUpdate(({ addListener, update, submit }) => {
			const { viewBounds, left, width } = props;
			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);

				const tOfFrame = 1 / props.compositionLength;

				const canvasWidth = width - TIMELINE_CANVAS_END_START_BUFFER * 2;
				const canvasLeft = left + TIMELINE_CANVAS_END_START_BUFFER;

				let t = pos.subX(canvasLeft).x / canvasWidth;

				t = Math.max(t, viewBounds[0] + tOfFrame * MIN_FRAMES_BETWEEN);
				t = Math.min(t, 1);

				update([viewBounds[0], t]);
			});

			addListener.once("mouseup", () => submit());
		});
	},

	/**
	 * When the user moves the viewBounds bar around
	 */
	onMoveViewBounds: (e: React.MouseEvent, props: ViewBoundsProps): void => {
		const initialMousePos = Vec2.fromEvent(e);

		props.requestUpdate(({ addListener, update, submit }) => {
			const { viewBounds, left, width } = props;

			let initialT = initialMousePos.subX(left).x / width;

			initialT = Math.max(initialT, viewBounds[0]);
			initialT = Math.min(initialT, 1);

			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);

				const t = pos.subX(left).x / width;

				const tChange = t - initialT;

				const rightShiftMax = 1 - viewBounds[1];
				const leftShiftMax = -viewBounds[0];

				const newBounds = [viewBounds[0], viewBounds[1]] as [number, number];
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

				update(newBounds);
			});

			addListener.once("mouseup", () => submit());
		});
	},
};
