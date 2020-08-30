import { useRef } from "react";
import { Tool } from "~/constants";
import { cssCursors } from "~/cssVariables";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { isKeyDown } from "~/listener/keyboard";
import {
	getPathTargetObject,
	getShapeContinuePathFrom,
	getShapeLayerPathIds,
	getShapePathClosePathNodeId,
	getSingleSelectedShapeLayerId,
} from "~/shape/shapeUtils";
import { getActionState } from "~/state/stateUtils";
import { constructPenToolContext } from "~/workspace/penTool/penToolContext";

interface Options {
	compositionId: string;
	viewport: Rect;
	areaId: string;
	keyDown: {
		Alt: boolean;
	};
}

const moveTool = (e: React.MouseEvent, el: HTMLElement, options: Options) => {
	const { compositionId, areaId, viewport, keyDown } = options;
	const { compositionState, compositionSelectionState } = getActionState();

	// If we have a single selected shape layer, we want to change the cursor
	// when hovering over objects in the selected layer's shapes.
	const layerId = getSingleSelectedShapeLayerId(
		compositionId,
		compositionState,
		compositionSelectionState,
	);

	if (layerId) {
		const ctx = constructPenToolContext(e, layerId, areaId, viewport);

		const pathIds = getShapeLayerPathIds(layerId, compositionState);
		for (const pathId of pathIds) {
			const { type } = getPathTargetObject(pathId, ctx);

			if (type) {
				if (type === "control_point" && keyDown.Alt) {
					el.style.cursor = cssCursors.penTool.convertAnchor;
					return;
				}

				el.style.cursor = cssCursors.moveTool.moveSelection;
				return;
			}
		}
	}

	el.style.cursor = cssCursors.moveTool.default;
};

const penTool = (e: React.MouseEvent, el: HTMLElement, options: Options) => {
	const { compositionId, areaId, viewport, keyDown } = options;
	const { compositionState, compositionSelectionState } = getActionState();

	const layerId = getSingleSelectedShapeLayerId(
		compositionId,
		compositionState,
		compositionSelectionState,
	);

	if (!layerId) {
		el.style.cursor = cssCursors.penTool.default;
		return;
	}

	const ctx = constructPenToolContext(e, layerId, areaId, viewport);
	const { shapeState, shapeSelectionState } = ctx;

	const pathIds = getShapeLayerPathIds(layerId, compositionState);

	for (const pathId of pathIds) {
		const { type, id } = getPathTargetObject(pathId, ctx);

		switch (type) {
			case "node": {
				// See if node is close node
				const continueFrom = getShapeContinuePathFrom(
					pathIds,
					shapeState,
					shapeSelectionState,
				);
				const closeNodeId =
					continueFrom && getShapePathClosePathNodeId(continueFrom, shapeState);

				if (closeNodeId === id) {
					el.style.cursor = cssCursors.penTool.closePath;
					break;
				}

				el.style.cursor = cssCursors.penTool.moveSelection;
				break;
			}
			case "control_point": {
				if (keyDown.Alt) {
					el.style.cursor = cssCursors.penTool.convertAnchor;
					break;
				}

				el.style.cursor = cssCursors.penTool.moveSelection;
				break;
			}
			default:
				continue;
		}
		return;
	}

	el.style.cursor = cssCursors.penTool.default;
};

export const useWorkspaceCursor = (
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
		};
		const opts = { ...options, keyDown };

		const tool = getActionState().tool.selected;

		if (tool === Tool.move) {
			moveTool(e, canvasEl, opts);
			return;
		}

		if (tool === Tool.pen) {
			penTool(e, canvasEl, opts);
			return;
		}

		canvasEl.style.cursor = cssCursors.moveTool.default;
	};

	const onMouseMove = (e: React.MouseEvent) => {
		e.persist();
		lastEv.current = e;
		update();
	};

	useKeyDownEffect("Alt", () => update());

	return onMouseMove;
};
