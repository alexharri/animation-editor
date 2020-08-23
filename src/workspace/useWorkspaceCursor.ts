import { Tool } from "~/constants";
import { cssCursors } from "~/cssVariables";
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
}

const moveTool = (e: React.MouseEvent, el: HTMLElement, options: Options) => {
	const { compositionId, areaId, viewport } = options;
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
				el.style.cursor = cssCursors.moveTool.moveSelection;
				return;
			}
		}
	}

	el.style.cursor = cssCursors.moveTool.default;
};

const penTool = (e: React.MouseEvent, el: HTMLElement, options: Options) => {
	const { compositionId, areaId, viewport } = options;
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
	options: Options,
): ((e: React.MouseEvent) => void) => {
	const onMouseMove = (e: React.MouseEvent) => {
		const canvasEl = canvasRef.current;

		if (!canvasEl) {
			return;
		}

		const tool = getActionState().tool.selected;

		if (tool === Tool.move) {
			moveTool(e, canvasEl, options);
			return;
		}

		if (tool === Tool.pen) {
			penTool(e, canvasEl, options);
			return;
		}

		canvasEl.style.cursor = cssCursors.moveTool.default;
	};

	return onMouseMove;
};
