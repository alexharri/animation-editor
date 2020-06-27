import { areaActions } from "~/area/state/areaActions";
import { requestAction } from "~/listener/requestAction";
import { nodeEditorAreaActions } from "~/nodeEditor/nodeEditorAreaActions";
import { getAreaActionState } from "~/state/stateUtils";
import { isKeyDown } from "~/listener/keyboard";
import { isLeftClick } from "~/util/mouse";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { transformGlobalToNodeEditorRect } from "~/nodeEditor/nodeEditorUtils";
import { getDistance, rectOfTwoVecs } from "~/util/math";
import { clearElementFocus } from "~/util/focus";
import { getNodeEditorContextMenuOptions } from "~/nodeEditor/util/nodeEditorContextMenu";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType } from "~/constants";

export const nodeEditorHandlers = {
	onLeftClickOutside: (
		e: React.MouseEvent,
		graphId: string,
		areaId: string,
		scale: number,
		pan: Vec2,
	) => {
		e.preventDefault();
		clearElementFocus();

		requestAction({ history: true }, ({ addListener, dispatch, submitAction }) => {
			const initialMousePos = Vec2.fromEvent(e);

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

	onPanStart: (areaId: string, e: React.MouseEvent) => {
		e.preventDefault();

		const areaState = getAreaActionState<AreaType.NodeEditor>(areaId);
		const initialPos = Vec2.fromEvent(e);

		requestAction({}, ({ addListener, dispatch, submitAction }) => {
			addListener.repeated("mousemove", (e) => {
				const pos = Vec2.fromEvent(e);
				const diff = pos.sub(initialPos);
				const action = nodeEditorAreaActions.setPan(areaState.pan.add(diff));
				dispatch(areaActions.dispatchToAreaState(areaId, action));
			});

			addListener.once("mouseup", () => submitAction("Pan"));
		});
	},

	onZoomClick: (e: React.MouseEvent, areaId: string) => {
		e.preventDefault();

		if (!isLeftClick(e)) {
			return;
		}

		const areaState = getAreaActionState<AreaType.NodeEditor>(areaId);

		if (
			(areaState.scale < 0.0625 && isKeyDown("Alt")) ||
			(areaState.scale > 256 && !isKeyDown("Alt"))
		) {
			return;
		}

		requestAction({}, ({ dispatch, submitAction }) => {
			const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
			const fac = isKeyDown("Alt") ? 0.5 : 2;

			const pos = Vec2.fromEvent(e)
				.sub(Vec2.new(areaState.pan))
				.sub(Vec2.new(viewport.width / 2, viewport.height / 2))
				.sub(Vec2.new(viewport));

			const xt = pos.x / viewport.width;
			const yt = pos.y / viewport.height;

			const diff = Vec2.new(
				viewport.width * (xt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
				viewport.height * (yt * fac) * (isKeyDown("Alt") ? -1 : 0.5),
			);

			const panAction = nodeEditorAreaActions.setPan(areaState.pan.sub(diff));
			const scaleAction = nodeEditorAreaActions.setScale(areaState.scale * fac);

			dispatch(areaActions.dispatchToAreaState(areaId, panAction));
			dispatch(areaActions.dispatchToAreaState(areaId, scaleAction));
			submitAction("Zoom");
		});
	},
};
