import { Tool } from "~/constants";
import { cssCursors } from "~/cssVariables";
import {
	getPathTargetObject,
	getSelectedShapeLayerId,
	getShapeContinuePathFrom,
	getShapeLayerPathIds,
	getShapePathClosePathNodeId,
} from "~/shape/shapeUtils";
import { getActionState } from "~/state/stateUtils";
import { constructPenToolContext } from "~/workspace/penTool/penToolContext";

interface Options {
	compositionId: string;
	viewport: Rect;
	areaId: string;
}

const penTool = (e: React.MouseEvent, el: HTMLElement, options: Options) => {
	const { compositionId, areaId, viewport } = options;
	const { compositionState, compositionSelectionState } = getActionState();

	const layerId = getSelectedShapeLayerId(
		compositionId,
		compositionState,
		compositionSelectionState,
	);

	if (!layerId) {
		el.style.cursor = cssCursors.penTool.default;
		console.log(cssCursors.penTool.default);
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

		if (tool === Tool.pen) {
			penTool(e, canvasEl, options);
			return;
		}

		canvasEl.style.cursor = "";
	};

	return onMouseMove;
};
