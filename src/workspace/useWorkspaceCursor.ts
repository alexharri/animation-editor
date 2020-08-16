import { Tool } from "~/constants";
import { cssCursors } from "~/cssVariables";
import { getSelectedShapeLayerId } from "~/shape/shapeUtils";
import { getActionState } from "~/state/stateUtils";

interface Options {
	compositionId: string;
	viewport: Rect;
}

const penTool = (_e: React.MouseEvent, el: HTMLElement, options: Options) => {
	const { compositionId } = options;
	const { compositionState, compositionSelectionState } = getActionState();

	const selectedShapeLayer = getSelectedShapeLayerId(
		compositionId,
		compositionState,
		compositionSelectionState,
	);

	console.log(selectedShapeLayer);

	if (!selectedShapeLayer) {
		el.style.cursor = cssCursors.penTool.default;
		console.log(cssCursors.penTool.default);
		return;
	}

	el.style.cursor = "";
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
