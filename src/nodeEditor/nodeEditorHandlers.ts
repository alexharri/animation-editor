import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { nodeEditorAreaActions } from "~/nodeEditor/nodeEditorAreaActions";
import { transformGlobalToNodeEditorRect } from "~/nodeEditor/nodeEditorUtils";
import { getNodeEditorContextMenuOptions } from "~/nodeEditor/util/nodeEditorContextMenu";
import { createViewportWheelHandlers } from "~/shared/viewport/viewportWheelHandlers";
import { clearElementFocus } from "~/util/focus";
import { getDistance, rectOfTwoVecs } from "~/util/math";

export const nodeEditorHandlers = {
	onLeftClickOutside: (
		e: React.MouseEvent,
		graphId: string,
		areaId: string,
		scale: number,
		pan: Vec2,
	) => {
		const initialMousePos = Vec2.fromEvent(e);

		requestAction({ history: true }, ({ addListener, dispatch, submitAction }) => {
			let hasMoved = false;

			addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e);
				if (!hasMoved) {
					// We don't consider the mouse to be "moved" until the mouse has moved at least
					// 5px from where it was initially.
					if (getDistance(initialMousePos, mousePos) > 5 / scale) {
						hasMoved = true;
					} else {
						return;
					}
				}

				const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
				const rect = transformGlobalToNodeEditorRect(
					rectOfTwoVecs(initialMousePos, mousePos),
					viewport,
					scale,
					pan,
				);
				dispatch(nodeEditorActions.setDragSelectRect(graphId, rect));
			});

			addListener.once("mouseup", () => {
				if (hasMoved) {
					const isAdditiveSelection = isKeyDown("Shift");
					dispatch(nodeEditorActions.submitDragSelectRect(graphId, isAdditiveSelection));
					submitAction("Modify selection");
				} else {
					dispatch(nodeEditorActions.clearNodeSelection(graphId));
					submitAction("Modify selection");
				}
			});
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

			const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
			dispatch(
				contextMenuActions.openContextMenu(
					"Node Editor",
					getNodeEditorContextMenuOptions({
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

	...createViewportWheelHandlers(AreaType.NodeEditor, {
		setPan: nodeEditorAreaActions.setPan,
		setScale: nodeEditorAreaActions.setScale,
	}),
};
