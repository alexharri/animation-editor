import { getActionState } from "~/state/stateUtils";
import { getCompTimeTrackYPositions } from "~/composition/timeline/compTimeUtils";
import { valueWithinRange, valueWithinMargin } from "~/util/math";
import { COMP_TIME_LAYER_HEIGHT, COMP_TIME_TRACK_START_END_X_MARGIN } from "~/constants";
import { transformTimelineXToGlobalX } from "~/timeline/timelineUtils";

interface Options {
	compositionId: string;
	viewBounds: [number, number];
	viewport: Rect;
	panY: number;
}

export const useTrackEditorCanvasCursor = (
	canvasRef: React.RefObject<HTMLCanvasElement>,
	options: Options,
): ((e: React.MouseEvent) => void) => {
	const onMouseMove = (e: React.MouseEvent) => {
		const canvasEl = canvasRef.current;

		if (!canvasEl) {
			return;
		}

		const { compositionId, viewport, viewBounds, panY } = options;

		const { compositions: compositionState } = getActionState();
		const composition = compositionState.compositions[compositionId];

		const mousePos = Vec2.fromEvent(e);
		const yPosMap = getCompTimeTrackYPositions(composition.id, compositionState, panY);

		for (let i = 0; i < composition.layers.length; i += 1) {
			const layerId = composition.layers[i];
			const yPos = yPosMap.layer[layerId];

			if (!valueWithinRange(mousePos.y - viewport.top, yPos, yPos + COMP_TIME_LAYER_HEIGHT)) {
				continue;
			}

			const layer = compositionState.layers[layerId];

			const startX = transformTimelineXToGlobalX(
				layer.index,
				viewBounds,
				viewport,
				composition.length,
			);
			if (valueWithinMargin(mousePos.x, startX, COMP_TIME_TRACK_START_END_X_MARGIN)) {
				canvasEl.style.cursor = "ew-resize";
				return;
			}

			const endX = transformTimelineXToGlobalX(
				layer.index + layer.length,
				viewBounds,
				viewport,
				composition.length,
			);
			if (valueWithinMargin(mousePos.x, endX, COMP_TIME_TRACK_START_END_X_MARGIN)) {
				canvasEl.style.cursor = "ew-resize";
				return;
			}
		}

		canvasEl.style.cursor = "";
	};

	return onMouseMove;
};
