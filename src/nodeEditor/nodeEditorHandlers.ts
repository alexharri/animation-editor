import { areaActions } from "~/area/state/areaActions";
import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType, TRACKPAD_ZOOM_DELTA_FAC } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { nodeEditorAreaActions } from "~/nodeEditor/nodeEditorAreaActions";
import { transformGlobalToNodeEditorRect } from "~/nodeEditor/nodeEditorUtils";
import { getNodeEditorContextMenuOptions } from "~/nodeEditor/util/nodeEditorContextMenu";
import { getAreaActionState } from "~/state/stateUtils";
import { clearElementFocus } from "~/util/focus";
import { getDistance, interpolate, rectOfTwoVecs } from "~/util/math";
import { parseWheelEvent } from "~/util/wheelEvent";

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

	onPanStart: (areaId: string, e: React.MouseEvent) => {
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
		const mousePos = Vec2.fromEvent(e);
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

			const pos = mousePos
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

	onWheelScale: (e: WheelEvent, areaId: string, impact = 1) => {
		const { deltaY } = e;

		const mousePos = Vec2.fromEvent(e);
		const areaState = getAreaActionState<AreaType.NodeEditor>(areaId);
		const viewport = getAreaViewport(areaId, AreaType.NodeEditor);

		const fac = interpolate(1, -deltaY < 0 ? 0.85 : 1.15, impact);

		requestAction({ history: false }, (params) => {
			const pos = mousePos
				.sub(Vec2.new(areaState.pan))
				.sub(Vec2.new(viewport.width / 2, viewport.height / 2))
				.sub(Vec2.new(viewport));

			const xt = pos.x / viewport.width;
			const yt = pos.y / viewport.height;

			const xDiff = viewport.width * xt * ((1 - fac) / 1) * -1;
			const yDiff = viewport.height * yt * ((1 - fac) / 1) * -1;

			const diff = Vec2.new(xDiff, yDiff);

			const panAction = nodeEditorAreaActions.setPan(areaState.pan.sub(diff));
			const scaleAction = nodeEditorAreaActions.setScale(areaState.scale * fac);

			params.dispatch(areaActions.dispatchToAreaState(areaId, panAction));
			params.dispatch(areaActions.dispatchToAreaState(areaId, scaleAction));
			params.submitAction("Zoom");
		});
	},

	onWheelPan: (deltaX: number, deltaY: number, areaId: string) => {
		const areaState = getAreaActionState<AreaType.NodeEditor>(areaId);

		requestAction({ history: false }, (params) => {
			const pan = areaState.pan.add(Vec2.new(-deltaX, -deltaY));
			const panAction = nodeEditorAreaActions.setPan(pan);

			params.dispatch(areaActions.dispatchToAreaState(areaId, panAction));
			params.submitAction("Pan");
		});
	},

	onWheel: (e: WheelEvent, areaId: string) => {
		e.preventDefault();

		const normalized = parseWheelEvent(e);
		console.log(normalized.type);

		switch (normalized.type) {
			case "mouse_wheel": {
				nodeEditorHandlers.onWheelScale(e, areaId);
				break;
			}
			case "pinch_zoom": {
				nodeEditorHandlers.onWheelScale(
					e,
					areaId,
					Math.abs(e.deltaY) * TRACKPAD_ZOOM_DELTA_FAC,
				);
				break;
			}
			case "pan": {
				nodeEditorHandlers.onWheelPan(normalized.deltaX, normalized.deltaY, areaId);
				break;
			}
		}

		// if (e.ctrlKey) {
		// 	nodeEditorHandlers.onWheelScale(
		// 		e,
		// 		areaId,
		// 		Math.abs(n.deltaY) * TRACKPAD_ZOOM_DELTA_FAC,
		// 	);
		// 	return;
		// }

		// if (Math.abs((e as any).wheelDelta) % MOUSE_WHEEL_DELTA_INCR === 0) {
		// 	nodeEditorHandlers.onWheelScale(e, areaId);
		// 	return;
		// }

		// nodeEditorHandlers.onWheelPan(n.deltaX, n.deltaY, areaId);
	},

	onMouseWheel: (e: WheelEvent, areaId: string) => {
		e.preventDefault();

		console.log("mousewheel", e);
		nodeEditorHandlers.onWheelScale(e, areaId);
	},
};
