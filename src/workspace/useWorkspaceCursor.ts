import { useRef } from "react";
import { Tool } from "~/constants";
import { cssCursors } from "~/cssVariables";
import { useKeyDownEffect } from "~/hook/useKeyDown";
import { isKeyDown } from "~/listener/keyboard";
import {
	getPathTargetObjectFromContext,
	getShapeContinuePathFrom,
	getShapeLayerPathIds,
	getShapeLayerSelectedPathIds,
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
		Command: boolean;
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
		const ctx = constructPenToolContext(Vec2.fromEvent(e), layerId, areaId, viewport);

		const pathIds = getShapeLayerPathIds(layerId, compositionState);
		for (const pathId of pathIds) {
			const { type } = getPathTargetObjectFromContext(pathId, ctx);

			if (type) {
				if (type === "control_point" && keyDown.Alt) {
					el.style.cursor = cssCursors.penTool.convertAnchor;
					return;
				}

				if (type === "node" && keyDown.Command) {
					el.style.cursor = cssCursors.penTool.newControlPoints;
					return;
				}

				if (type === "node" && keyDown.Alt) {
					el.style.cursor = cssCursors.penTool.removePoint;
					return;
				}

				if (type === "point_on_edge") {
					// For now we don't support edge selection.
					//
					// I expect it to be added in the near future.
					continue;
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

	const ctx = constructPenToolContext(Vec2.fromEvent(e), layerId, areaId, viewport);
	const { shapeState, shapeSelectionState } = ctx;

	const pathIds = getShapeLayerSelectedPathIds(
		layerId,
		compositionState,
		compositionSelectionState,
	);

	for (const pathId of pathIds) {
		const { type, id } = getPathTargetObjectFromContext(pathId, ctx);

		switch (type) {
			case "node": {
				if (keyDown.Command) {
					el.style.cursor = cssCursors.penTool.newControlPoints;
					break;
				}

				if (keyDown.Alt) {
					el.style.cursor = cssCursors.penTool.removePoint;
					break;
				}

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
			case "point_on_edge": {
				el.style.cursor = cssCursors.penTool.addPoint;
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
			Command: isKeyDown("Command"),
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
	useKeyDownEffect("Command", () => update());

	return onMouseMove;
};
