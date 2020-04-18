import { areaActions } from "~/area/state/areaActions";
import { requestAction } from "~/listener/requestAction";
import { nodeEditorAreaActions } from "~/nodeEditor/nodeEditorAreaActions";
import { getAreaActionState } from "~/state/stateUtils";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { isKeyDown } from "~/listener/keyboard";
import { isLeftClick } from "~/util/mouse";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { nodeEditorGraphActions } from "~/nodeEditor/nodeEditorGraphActions";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { NodeEditorNodeType } from "~/types";
import {
	transformGlobalToNodeEditorPosition,
	transformGlobalToNodeEditorRect,
} from "~/nodeEditor/nodeEditorUtils";
import { getDistance, rectOfTwoVecs } from "~/util/math";

export const nodeEditorHandlers = {
	onLeftClickOutside: (
		e: React.MouseEvent,
		graphId: string,
		viewport: Rect,
		scale: number,
		pan: Vec2,
	) => {
		e.preventDefault();

		const shouldAddToStack = (prevState: ActionState, _nextState: ActionState): boolean => {
			return true;
			const nKeys = Object.keys(prevState.nodeEditor.graphs[graphId].selection.nodes).length;
			return nKeys !== 0;
		};

		requestAction(
			{ history: true, shouldAddToStack },
			({ addListener, dispatch: _dispatch, submitAction }) => {
				const dispatch = (action: any) =>
					_dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

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

					const rect = transformGlobalToNodeEditorRect(
						rectOfTwoVecs(initialMousePos, mousePos),
						viewport,
						scale,
						pan,
					);
					dispatch(nodeEditorGraphActions.setDragSelectRect(rect));
				});

				addListener.once("mouseup", () => {
					if (hasMoved) {
						const isAdditiveSelection = isKeyDown("Shift");
						dispatch(nodeEditorGraphActions.submitDragSelectRect(isAdditiveSelection));
						submitAction("Modify selection");
					} else {
						dispatch(nodeEditorGraphActions.clearNodeSelection());
						submitAction("Modify selection");
					}
				});
			},
		);
	},

	onRightClickOutside: (
		e: React.MouseEvent,
		graphId: string,
		viewport: Rect,
		scale: number,
		pan: Vec2,
		setClickCapture: (fn: { fn: ((e: React.MouseEvent) => void) | null }) => void,
	) => {
		const pos = Vec2.fromEvent(e);

		let didAddNode = false;

		requestAction(
			{ history: true, shouldAddToStack: () => didAddNode },
			({ cancelAction, dispatch: _dispatch, submitAction, execOnComplete }) => {
				// Cleanup click capture on completion
				execOnComplete(() => setClickCapture({ fn: null }));

				const onAddSelect = (type: NodeEditorNodeType) => {
					didAddNode = true;
					const dispatch = (action: any) =>
						_dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

					dispatch(nodeEditorGraphActions.startAddNode(type));
					_dispatch(contextMenuActions.closeContextMenu());
					const fn = (e: React.MouseEvent) => {
						if (!e) {
							return;
						}
						const pos = transformGlobalToNodeEditorPosition(
							Vec2.fromEvent(e),
							viewport,
							scale,
							pan,
						);
						dispatch(nodeEditorGraphActions.submitAddNode(pos));
						submitAction("Add node");
					};
					setClickCapture({ fn });
				};

				const createAddNodeOption = (type: NodeEditorNodeType, label: string) => ({
					label,
					onSelect: () => onAddSelect(type),
				});

				_dispatch(
					contextMenuActions.openContextMenu(
						"Node Editor",
						[
							{
								label: "Vec2 Nodes",
								options: [createAddNodeOption(NodeEditorNodeType.add_vec2, "Add")],
								default: true,
							},
						],
						pos,
						cancelAction,
					),
				);
			},
		);
	},

	onPanStart: (areaId: string, e: React.MouseEvent) => {
		e.preventDefault();

		const areaState = getAreaActionState<NodeEditorAreaState>(areaId);
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

	onZoomClick: (e: React.MouseEvent, areaId: string, viewport: Rect) => {
		e.preventDefault();

		if (!isLeftClick(e)) {
			return;
		}

		const areaState = getAreaActionState<NodeEditorAreaState>(areaId);

		if (
			(areaState.scale < 0.0625 && isKeyDown("Alt")) ||
			(areaState.scale > 256 && !isKeyDown("Alt"))
		) {
			return;
		}

		requestAction({}, ({ dispatch, submitAction }) => {
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
