import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
import { nodeEditorGraphActions } from "~/nodeEditor/nodeEditorGraphActions";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { getDistance } from "~/util/math";
import { NodeEditorAreaState } from "~/nodeEditor/nodeEditorAreaReducer";
import { transformGlobalToNodeEditorPosition } from "~/nodeEditor/nodeEditorUtils";
import { nodeEditorActions } from "~/nodeEditor/nodeEditorActions";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import {
	calculateNodeOutputPosition,
	calculateNodeInputPosition,
} from "~/nodeEditor/util/calculateNodeHeight";
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorGraphReducer";

const getAllInputsOfType = (graph: NodeEditorGraphState, nodeId: string, outputIndex: number) => {
	const allNodeInputsOfType: Array<{
		nodeId: string;
		inputIndex: number;
		position: Vec2;
	}> = [];

	const output = graph.nodes[nodeId].outputs[outputIndex];

	for (const key in graph.nodes) {
		if (key === nodeId) {
			continue;
		}

		const node = graph.nodes[key];

		for (let i = 0; i < node.inputs.length; i += 1) {
			const input = node.inputs[i];
			if (input.type === output.type) {
				const position = calculateNodeInputPosition(node, i);
				allNodeInputsOfType.push({ inputIndex: i, nodeId: key, position });
			}
		}
	}

	return allNodeInputsOfType;
};

const getAllOutputsOfType = (graph: NodeEditorGraphState, nodeId: string, inputIndex: number) => {
	const allNodeOutputsOfType: Array<{
		nodeId: string;
		outputIndex: number;
		position: Vec2;
	}> = [];

	const input = graph.nodes[nodeId].inputs[inputIndex];

	for (const key in graph.nodes) {
		if (key === nodeId) {
			continue;
		}

		const node = graph.nodes[key];

		for (let i = 0; i < node.outputs.length; i += 1) {
			const output = node.outputs[i];
			if (output.type === input.type) {
				const position = calculateNodeOutputPosition(node, i);
				allNodeOutputsOfType.push({ outputIndex: i, nodeId: key, position });
			}
		}
	}

	return allNodeOutputsOfType;
};

export const nodeHandlers = {
	onRightClick: (e: React.MouseEvent, graphId: string, nodeId: string) => {
		requestAction({ history: true }, ({ submitAction, dispatch, cancelAction }) => {
			const dispatchToGraph = (action: any) =>
				dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

			dispatch(
				contextMenuActions.openContextMenu(
					"Node",
					[
						{
							label: "Delete",
							onSelect: () => {
								dispatch(contextMenuActions.closeContextMenu());
								dispatchToGraph(nodeEditorGraphActions.removeNode(nodeId));
								submitAction("Remove node");
							},
							default: true,
						},
					],
					Vec2.fromEvent(e),
					cancelAction,
				),
			);
		});
	},

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

				addListener.repeated("mousemove", (e) => {
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

	onOutputMouseDown: (
		_: React.MouseEvent,
		areaId: string,
		graphId: string,
		nodeId: string,
		outputIndex: number,
		viewport: Rect,
	) => {
		requestAction(
			{ history: true },
			({ dispatch: _dispatch, addListener, submitAction, cancelAction }) => {
				const dispatch = (action: any) =>
					_dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

				const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);
				const graph = getActionState().nodeEditor.graphs[graphId];

				const transformMousePosition = (mousePosition: Vec2) =>
					transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

				const allNodeInputsOfType = getAllInputsOfType(graph, nodeId, outputIndex);

				let hasInit = false;

				addListener.repeated("mousemove", (e) => {
					const mousePos = transformMousePosition(Vec2.fromEvent(e));

					if (!hasInit) {
						dispatch(
							nodeEditorGraphActions.initDragOutputTo(mousePos, {
								outputIndex,
								nodeId,
							}),
						);
						hasInit = true;
					}

					let dist = -1;
					let wouldConnectTo: { nodeId: string; inputIndex: number } | null = null;

					for (let i = 0; i < allNodeInputsOfType.length; i += 1) {
						const { nodeId, inputIndex, position } = allNodeInputsOfType[i];
						const currDist = getDistance(position, mousePos);

						if ((dist === -1 || currDist < dist) && currDist < 15 / scale) {
							dist = currDist;
							wouldConnectTo = { nodeId, inputIndex };
						}
					}

					dispatch(nodeEditorGraphActions.setDragOutputTo(mousePos, wouldConnectTo));
				});

				addListener.once("mouseup", () => {
					const graph = getActionState().nodeEditor.graphs[graphId];

					if (graph._dragOutputTo?.wouldConnectToInput) {
						dispatch(nodeEditorGraphActions.submitDragOutputTo());
						submitAction("Connect output to input");
						return;
					}

					cancelAction();
				});
			},
		);
	},

	onInputMouseDown: (
		_: React.MouseEvent,
		areaId: string,
		graphId: string,
		nodeId: string,
		inputIndex: number,
		viewport: Rect,
	) => {
		const cb: RequestActionCallback = ({
			dispatch: _dispatch,
			addListener,
			submitAction,
			cancelAction,
		}) => {
			const dispatch = (action: any) =>
				_dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

			const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);
			const graph = getActionState().nodeEditor.graphs[graphId];

			const transformMousePosition = (mousePosition: Vec2) =>
				transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

			const allNodeOutputsOfType = getAllOutputsOfType(graph, nodeId, inputIndex);

			let hasInit = false;

			addListener.repeated("mousemove", (e) => {
				const mousePos = transformMousePosition(Vec2.fromEvent(e));

				if (!hasInit) {
					dispatch(
						nodeEditorGraphActions.initDragInputTo(mousePos, {
							inputIndex,
							nodeId,
						}),
					);
					hasInit = true;
				}

				let dist = -1;
				let wouldConnectTo: { nodeId: string; outputIndex: number } | null = null;

				for (let i = 0; i < allNodeOutputsOfType.length; i += 1) {
					const { nodeId, outputIndex, position } = allNodeOutputsOfType[i];
					const currDist = getDistance(position, mousePos);

					if ((dist === -1 || currDist < dist) && currDist < 15 / scale) {
						dist = currDist;
						wouldConnectTo = { nodeId, outputIndex };
					}
				}

				dispatch(nodeEditorGraphActions.setDragInputTo(mousePos, wouldConnectTo));
			});

			addListener.once("mouseup", () => {
				const graph = getActionState().nodeEditor.graphs[graphId];

				if (graph._dragInputTo?.wouldConnectToOutput) {
					dispatch(nodeEditorGraphActions.submitDragInputTo());
					submitAction("Connect input to output");
					return;
				}

				cancelAction();
			});
		};
		requestAction({ history: true }, cb);
	},

	onInputWithPointerMouseDown: (
		_: React.MouseEvent,
		areaId: string,
		graphId: string,
		nodeId: string,
		inputIndex: number,
		viewport: Rect,
	) => {
		const cb: RequestActionCallback = ({
			dispatch: _dispatch,
			addListener,
			submitAction,
			cancelAction,
		}) => {
			const dispatch = (action: any) =>
				_dispatch(nodeEditorActions.dispatchToGraph(graphId, action));

			const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);
			const graph = getActionState().nodeEditor.graphs[graphId];

			const transformMousePosition = (mousePosition: Vec2) =>
				transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

			const pointer = graph.nodes[nodeId].inputs[inputIndex].pointer;

			if (!pointer) {
				console.warn(`No pointer for '${nodeId}' input at index '${inputIndex}'`);
				cancelAction();
				return;
			}

			const allNodeInputsOfType = getAllInputsOfType(
				graph,
				pointer.nodeId,
				pointer.outputIndex,
			);

			let hasInit = false;

			addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e).apply(transformMousePosition);

				if (!hasInit) {
					dispatch(nodeEditorGraphActions.removeInputPointer(nodeId, inputIndex));
					dispatch(
						nodeEditorGraphActions.initDragOutputTo(mousePos, {
							outputIndex: pointer.outputIndex,
							nodeId: pointer.nodeId,
						}),
					);
					hasInit = true;
				}

				let dist = -1;
				let wouldConnectTo: { nodeId: string; inputIndex: number } | null = null;

				for (let i = 0; i < allNodeInputsOfType.length; i += 1) {
					const { nodeId, inputIndex, position } = allNodeInputsOfType[i];
					const currDist = getDistance(position, mousePos);

					if ((dist === -1 || currDist < dist) && currDist < 15 / scale) {
						dist = currDist;
						wouldConnectTo = { nodeId, inputIndex };
					}
				}

				dispatch(nodeEditorGraphActions.setDragOutputTo(mousePos, wouldConnectTo));
			});

			addListener.once("mouseup", () => {
				const graph = getActionState().nodeEditor.graphs[graphId];

				if (graph._dragOutputTo?.wouldConnectToInput) {
					if (
						graph._dragOutputTo.wouldConnectToInput.inputIndex === inputIndex &&
						graph._dragOutputTo.wouldConnectToInput.nodeId === nodeId
					) {
						cancelAction();
						return;
					}

					dispatch(nodeEditorGraphActions.submitDragOutputTo());
					submitAction("Move input to output");
				} else {
					dispatch(nodeEditorGraphActions.clearDragOutputTo());
					submitAction("Disconnect input");
				}
			});
		};

		requestAction({ history: true }, cb);
	},
};
