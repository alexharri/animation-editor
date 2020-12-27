import { useRef } from "react";
import { AreaType } from "~/constants";
import { cssCursors } from "~/cssVariables";
import { constructGraphEditorContext } from "~/graphEditor/graphEditorContext";
import { getGraphEditorTimelineTargetObject } from "~/graphEditor/graphEditorUtils";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { isKeyDown } from "~/listener/keyboard";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { getSelectedTimelineIdsInComposition } from "~/timeline/timelineUtils";

interface Options {
	areaId: string;
	viewport: Rect;
	keyDown: {
		Alt: boolean;
		Command: boolean;
	};
}

const render = (e: React.MouseEvent, canvas: HTMLCanvasElement, opts: Options) => {
	const { areaId, keyDown, viewport } = opts;

	const { compositionState, compositionSelectionState } = getActionState();
	const { compositionId } = getAreaActionState<AreaType.Timeline>(areaId);
	const { timelineIds } = getSelectedTimelineIdsInComposition(
		compositionId,
		compositionState,
		compositionSelectionState,
	);

	if (timelineIds.length === 0) {
		canvas.style.cursor = "";
		return;
	}

	const ctx = constructGraphEditorContext(Vec2.fromEvent(e), areaId, viewport);
	const { timelines } = ctx;

	for (const timeline of timelines) {
		const target = getGraphEditorTimelineTargetObject(
			timeline,
			ctx.mousePosition.viewport,
			ctx.normalToViewport,
		);

		switch (target.type) {
			case "keyframe": {
				if (keyDown.Alt) {
					canvas.style.cursor = cssCursors.penTool.convertAnchor;
					return;
				}

				canvas.style.cursor = cssCursors.moveTool.moveSelection;
				return;
			}

			case "control_point": {
				if (keyDown.Alt) {
					canvas.style.cursor = cssCursors.penTool.convertAnchor;
					return;
				}

				canvas.style.cursor = cssCursors.moveTool.moveSelection;
				return;
			}
		}
	}

	canvas.style.cursor = cssCursors.moveTool.default;
};

export const useGraphEditorCursor = (
	canvasRef: React.RefObject<HTMLCanvasElement>,
	options: Omit<Options, "keyDown">,
): ((e: React.MouseEvent) => void) => {
	let lastEv = useRef<React.MouseEvent | null>(null);

	const update = () => {
		const canvasEl = canvasRef.current;
		if (!canvasEl) {
			return;
		}

		const e = lastEv.current;
		if (!e) {
			return;
		}

		const keyDown: Options["keyDown"] = {
			Alt: isKeyDown("Alt"),
			Command: isKeyDown("Command"),
		};
		const opts = { ...options, keyDown };

		render(e, canvasEl, opts);
	};

	const onMouseMove = (e: React.MouseEvent) => {
		e.persist();
		lastEv.current = e;
		update();
	};

	useKeyDownEffect("Alt", () => update());
	useKeyDownEffect("Command", () => update());

	return onMouseMove;
};
