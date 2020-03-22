import { requestAction } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import { nodeEditorGraphActions } from "~/nodeEditor/nodeEditorGraphActions";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { getDistance } from "~/util/math";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { transformGlobalToNodeEditorPosition } from "~/nodeEditor/nodeEditorUtils";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";

export const nodeHandlers = {
	mouseDown: (
		e: React.MouseEvent,
		areaId: string,
		graphId: string,
		nodeId: string,
		viewport: Rect,
	) => {
		e.preventDefault();

		const shouldAddToStack = (prevState: ActionState, nextState: ActionState): boolean => {
			// Check if move vector has changed

			if (
				prevState.nodeEditor.graphs[graphId].moveVector !==
				nextState.nodeEditor.graphs[graphId].moveVector
			) {
				return true;
			}

			// Check if selection has changed

			const prevSelected = Object.keys(prevState.nodeEditor.graphs[graphId].selection.nodes);
			const nextSelected = Object.keys(nextState.nodeEditor.graphs[graphId].selection.nodes);

			if (prevSelected.length !== nextSelected.length) {
				return true;
			}

			const nextSelectedSet = new Set(...nextSelected);

			for (let i = 0; i < prevSelected.length; i += 1) {
				if (!nextSelectedSet.has(prevSelected[i])) {
					return true;
				}
			}

			return false;
		};

		requestAction(
			{ history: true, shouldAddToStack },
			({ submitAction, dispatch: _dispatch, addListener }) => {
				const shiftKeyDownAtMouseDown = isKeyDown("Shift");

				const dispatch = (action: any) =>
					_dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

				const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);

				const transformMousePosition = (mousePosition: Vec2) =>
					transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

				const graph = getActionState().nodeEditor.graphs[graphId];

				// If the shift key is down, we modify the selection state immediately by
				// toggling the selection state of the node that was clicked.
				if (shiftKeyDownAtMouseDown) {
					dispatch(nodeEditorGraphActions.toggleNodeSelection(nodeId));
				} else if (!graph.selection.nodes[nodeId]) {
					// If the current node is not selected, we clear the node selectction state
					// and add the clicked node to the selection.
					dispatch(nodeEditorGraphActions.clearNodeSelection());
					dispatch(nodeEditorGraphActions.addNodeToSelection(nodeId));
				}

				const initialMousePos = transformMousePosition(Vec2.fromEvent(e));
				let hasMoved = false;

				addListener.repeated("mousemove", e => {
					const mousePos = transformMousePosition(Vec2.fromEvent(e));
					if (!hasMoved) {
						// We don't consider the mouse to be "moved" until the mouse has moved at least
						// 5px from where it was initially.
						if (getDistance(initialMousePos, mousePos) > 5 / scale) {
							hasMoved = true;
						} else {
							return;
						}
					}

					const moveVector = mousePos.sub(initialMousePos).round();
					dispatch(nodeEditorGraphActions.setMoveVector(moveVector));
				});

				addListener.once("mouseup", () => {
					if (hasMoved) {
						dispatch(nodeEditorGraphActions.applyMoveVector());
						submitAction("Move selection");
					} else {
						if (!shiftKeyDownAtMouseDown) {
							dispatch(nodeEditorGraphActions.clearNodeSelection());
							dispatch(nodeEditorGraphActions.addNodeToSelection(nodeId));
						}
						submitAction("Modify selection");
					}
				});
			},
		);
	},
};
