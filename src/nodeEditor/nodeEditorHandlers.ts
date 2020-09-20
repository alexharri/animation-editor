import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { nodeEditorAreaActions } from "~/nodeEditor/nodeEditorAreaActions";
import { nodeEditorGlobalToNormal } from "~/nodeEditor/nodeEditorUtils";
import { getNodeEditorContextMenuOptions } from "~/nodeEditor/util/nodeEditorContextMenu";
import { createViewportWheelHandlers } from "~/shared/viewport/viewportWheelHandlers";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { clearElementFocus } from "~/util/focus";
import { rectOfTwoVecs } from "~/util/math";

export const nodeEditorHandlers = {
	onLeftClickOutside: (
		e: React.MouseEvent,
		graphId: string,
		areaId: string,
		scale: number,
		pan: Vec2,
	) => {
		const isAdditiveSelection = isKeyDown("Shift");
		const viewport = getAreaViewport(areaId, AreaType.NodeEditor);

		mouseDownMoveAction(e, {
			translate: (vec) => nodeEditorGlobalToNormal(vec, viewport, scale, pan),
			keys: [],
			beforeMove: () => {},
			mouseMove: (params, { initialMousePosition, mousePosition }) => {
				const rect = rectOfTwoVecs(initialMousePosition.normal, mousePosition.normal);
				params.dispatch(nodeEditorActions.setDragSelectRect(graphId, rect));
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					params.dispatch(nodeEditorActions.clearNodeSelection(graphId));
					params.submitAction("Modify selection");
					return;
				}

				params.dispatch(
					nodeEditorActions.submitDragSelectRect(graphId, isAdditiveSelection),
				);
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
