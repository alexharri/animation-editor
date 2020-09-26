import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { flowActions } from "~/flow/flowActions";
import { flowAreaActions } from "~/flow/flowAreaActions";
import { flowEditorGlobalToNormal } from "~/flow/flowUtils";
import { getFlowGraphContextMenuOptions } from "~/flow/util/flowGraphContextMenu";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { createViewportWheelHandlers } from "~/shared/viewport/viewportWheelHandlers";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { clearElementFocus } from "~/util/focus";
import { rectOfTwoVecs } from "~/util/math";

export const flowEditorHandlers = {
	onLeftClickOutside: (
		e: React.MouseEvent,
		graphId: string,
		areaId: string,
		scale: number,
		pan: Vec2,
	) => {
		const isAdditiveSelection = isKeyDown("Shift");
		const viewport = getAreaViewport(areaId, AreaType.FlowEditor);

		mouseDownMoveAction(e, {
			translate: (vec) => flowEditorGlobalToNormal(vec, viewport, scale, pan),
			keys: [],
			beforeMove: () => {},
			mouseMove: (params, { initialMousePosition, mousePosition }) => {
				const rect = rectOfTwoVecs(initialMousePosition.normal, mousePosition.normal);
				params.dispatch(flowActions.setDragSelectRect(graphId, rect));
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					params.dispatch(flowActions.clearNodeSelection(graphId));
					params.submitAction("Modify selection");
					return;
				}

				params.dispatch(flowActions.submitDragSelectRect(graphId, isAdditiveSelection));
				params.submitAction("Modify selection");
			},
		});
	},

	onRightClickOutside: (
		e: React.MouseEvent,
		graphId: string,
		areaId: string,
		setClickCapture: (fn: { fn: ((e: React.MouseEvent) => void) | null }) => void,
	) => {
		const pos = Vec2.fromEvent(e);
		clearElementFocus();

		requestAction({ history: true }, (params) => {
			const { cancelAction, dispatch, execOnComplete } = params;

			// Cleanup click capture on completion
			execOnComplete(() => setClickCapture({ fn: null }));

			const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
			dispatch(
				contextMenuActions.openContextMenu(
					"Node Editor",
					getFlowGraphContextMenuOptions({
						params,
						graphId,
						areaId,
						viewport,
						setClickCapture,
					}),
					pos,
					cancelAction,
				),
			);
		});
	},

	...createViewportWheelHandlers(AreaType.FlowEditor, {
		setPan: flowAreaActions.setPan,
		setScale: flowAreaActions.setScale,
	}),
};
