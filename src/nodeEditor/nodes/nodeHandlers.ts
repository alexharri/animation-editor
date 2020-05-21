import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { isKeyDown } from "~/listener/keyboard";
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
import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { clearElementFocus } from "~/util/focus";
import { NODE_EDITOR_MIN_NODE_WIDTH, AreaType } from "~/constants";
import { getAreaViewport } from "~/area/util/getAreaViewport";

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
			dispatch(
				contextMenuActions.openContextMenu(
					"Node",
					[
						{
							label: "Delete",
							onSelect: () => {
								dispatch(contextMenuActions.closeContextMenu());
								dispatch(nodeEditorActions.removeNode(graphId, nodeId));
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

	mouseDown: (e: React.MouseEvent, areaId: string, graphId: string, nodeId: string) => {
		e.preventDefault();
		clearElementFocus();

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
			({ submitAction, dispatch, addListener }) => {
				const shiftKeyDownAtMouseDown = isKeyDown("Shift");

				const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);

				const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
				const transformMousePosition = (mousePosition: Vec2) =>
					transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

				const graph = getActionState().nodeEditor.graphs[graphId];

				// If the shift key is down, we modify the selection state immediately by
				// toggling the selection state of the node that was clicked.
				if (shiftKeyDownAtMouseDown) {
					dispatch(nodeEditorActions.toggleNodeSelection(graphId, nodeId));
				} else if (!graph.selection.nodes[nodeId]) {
					// If the current node is not selected, we clear the node selectction state
					// and add the clicked node to the selection.
					dispatch(nodeEditorActions.clearNodeSelection(graphId));
					dispatch(nodeEditorActions.addNodeToSelection(graphId, nodeId));
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
					dispatch(nodeEditorActions.setMoveVector(graphId, moveVector));
				});

				addListener.once("mouseup", () => {
					if (hasMoved) {
						dispatch(nodeEditorActions.applyMoveVector(graphId));
						submitAction("Move selection");
					} else {
						if (!shiftKeyDownAtMouseDown) {
							dispatch(nodeEditorActions.clearNodeSelection(graphId));
							dispatch(nodeEditorActions.addNodeToSelection(graphId, nodeId));
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
	) => {
		requestAction(
			{ history: true },
			({ dispatch, addListener, submitAction, cancelAction }) => {
				const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);
				const graph = getActionState().nodeEditor.graphs[graphId];

				const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
				const transformMousePosition = (mousePosition: Vec2) =>
					transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

				const allNodeInputsOfType = getAllInputsOfType(graph, nodeId, outputIndex);

				let hasInit = false;

				addListener.repeated("mousemove", (e) => {
					const mousePos = transformMousePosition(Vec2.fromEvent(e));

					if (!hasInit) {
						dispatch(
							nodeEditorActions.initDragOutputTo(graphId, mousePos, {
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

					dispatch(nodeEditorActions.setDragOutputTo(graphId, mousePos, wouldConnectTo));
				});

				addListener.once("mouseup", () => {
					const graph = getActionState().nodeEditor.graphs[graphId];

					if (graph._dragOutputTo?.wouldConnectToInput) {
						dispatch(nodeEditorActions.submitDragOutputTo(graphId));
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
	) => {
		const cb: RequestActionCallback = ({
			dispatch,
			addListener,
			submitAction,
			cancelAction,
		}) => {
			const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);
			const graph = getActionState().nodeEditor.graphs[graphId];

			const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
			const transformMousePosition = (mousePosition: Vec2) =>
				transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

			const allNodeOutputsOfType = getAllOutputsOfType(graph, nodeId, inputIndex);

			let hasInit = false;

			addListener.repeated("mousemove", (e) => {
				const mousePos = transformMousePosition(Vec2.fromEvent(e));

				if (!hasInit) {
					dispatch(
						nodeEditorActions.initDragInputTo(graphId, mousePos, {
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

				dispatch(nodeEditorActions.setDragInputTo(graphId, mousePos, wouldConnectTo));
			});

			addListener.once("mouseup", () => {
				const graph = getActionState().nodeEditor.graphs[graphId];

				if (graph._dragInputTo?.wouldConnectToOutput) {
					dispatch(nodeEditorActions.submitDragInputTo(graphId));
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
	) => {
		const cb: RequestActionCallback = ({
			dispatch,
			addListener,
			submitAction,
			cancelAction,
		}) => {
			const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);
			const graph = getActionState().nodeEditor.graphs[graphId];

			const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
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
					dispatch(nodeEditorActions.removeInputPointer(graphId, nodeId, inputIndex));
					dispatch(
						nodeEditorActions.initDragOutputTo(graphId, mousePos, {
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

				dispatch(nodeEditorActions.setDragOutputTo(graphId, mousePos, wouldConnectTo));
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

					dispatch(nodeEditorActions.submitDragOutputTo(graphId));
					submitAction("Move input to output");
				} else {
					dispatch(nodeEditorActions.clearDragOutputTo(graphId));
					submitAction("Disconnect input");
				}
			});
		};

		requestAction({ history: true }, cb);
	},

	onWidthResizeMouseDown: (
		e: React.MouseEvent,
		areaId: string,
		graphId: string,
		nodeId: string,
	) => {
		e.preventDefault();
		requestAction(
			{ history: true },
			({ submitAction, cancelAction, dispatch, addListener }) => {
				const { pan, scale } = getAreaActionState<NodeEditorAreaState>(areaId);

				const viewport = getAreaViewport(areaId, AreaType.NodeEditor);
				const transformMousePosition = (mousePosition: Vec2) =>
					transformGlobalToNodeEditorPosition(mousePosition, viewport, scale, pan);

				const graph = getActionState().nodeEditor.graphs[graphId];

				const node = graph.nodes[nodeId];

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

					const width = Math.max(
						NODE_EDITOR_MIN_NODE_WIDTH,
						Math.round(mousePos.x - node.position.x),
					);
					dispatch(nodeEditorActions.setNodeWidth(graphId, nodeId, width));
				});

				addListener.once("mouseup", () => {
					if (!hasMoved) {
						cancelAction();
						return;
					}

					submitAction("Resize node width");
				});
			},
		);
	},
};
