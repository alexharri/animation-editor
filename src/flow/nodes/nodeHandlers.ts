import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType, FLOW_NODE_MIN_WIDTH } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { flowValidInputsToOutputsMap } from "~/flow/flowIO";
import { FlowGraph } from "~/flow/flowTypes";
import {
	didFlowSelectionChange,
	flowEditorGlobalToNormal,
	flowSelectionFromState,
} from "~/flow/flowUtils";
import { flowActions } from "~/flow/state/flowActions";
import { flowSelectionActions } from "~/flow/state/flowSelectionReducer";
import {
	calculateNodeInputPosition,
	calculateNodeOutputPosition,
} from "~/flow/util/flowNodeHeight";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { getDistance } from "~/util/math";

const getAllValidInputsForType = (graph: FlowGraph, nodeId: string, outputIndex: number) => {
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
			if (flowValidInputsToOutputsMap[output.type].indexOf(input.type) !== -1) {
				const position = calculateNodeInputPosition(node, i);
				allNodeInputsOfType.push({ inputIndex: i, nodeId: key, position });
			}
		}
	}

	return allNodeInputsOfType;
};

const getAllOutputsOfType = (graph: FlowGraph, nodeId: string, inputIndex: number) => {
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
		requestAction({ history: true }, (params) => {
			params.dispatch(
				contextMenuActions.openContextMenu(
					"Node",
					[
						{
							label: "Delete node",
							onSelect: () => {
								params.dispatch(
									contextMenuActions.closeContextMenu(),
									flowActions.removeNode(graphId, nodeId),
								);
								params.addDiff((diff) => diff.removeFlowNode({ nodeId, graphId }));
								params.submitAction("Remove node");
							},
							default: true,
						},
					],
					Vec2.fromEvent(e),
					params.cancelAction,
				),
			);
		});
	},

	mouseDown: (e: React.MouseEvent, areaId: string, graphId: string, nodeId: string) => {
		const didMoveVectorChange = (prevState: ActionState, nextState: ActionState): boolean => {
			return (
				prevState.flowState.graphs[graphId].moveVector !==
				nextState.flowState.graphs[graphId].moveVector
			);
		};

		const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
		const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
		const transformMousePosition = (mousePosition: Vec2) =>
			flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);
		const shiftKeyDownAtMouseDown = isKeyDown("Shift");
		const { flowSelectionState } = getActionState();

		const initialMousePos = transformMousePosition(Vec2.fromEvent(e));

		requestAction(
			{
				history: true,
				shouldAddToStack: [didFlowSelectionChange(graphId), didMoveVectorChange],
			},
			({ submitAction, dispatch, addListener }) => {
				const selection = flowSelectionFromState(graphId, flowSelectionState);

				// If the shift key is down, we modify the selection state immediately by
				// toggling the selection state of the node that was clicked.
				if (shiftKeyDownAtMouseDown) {
					dispatch(flowSelectionActions.toggleNode(graphId, nodeId));
				} else if (!selection.nodes[nodeId]) {
					// If the current node is not selected, we clear the node selectction state
					// and add the clicked node to the selection.
					dispatch(flowSelectionActions.clear(graphId));
					dispatch(flowSelectionActions.addNode(graphId, nodeId));
				}

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
					dispatch(flowActions.setMoveVector(graphId, moveVector));
				});

				addListener.once("mouseup", () => {
					const { flowSelectionState } = getActionState();
					const selection = flowSelectionFromState(graphId, flowSelectionState);
					if (hasMoved) {
						dispatch(flowActions.applyMoveVector(graphId, selection));
						submitAction("Move selection", { allowIndexShift: true });
					} else {
						if (!shiftKeyDownAtMouseDown) {
							dispatch(flowSelectionActions.clear(graphId));
							dispatch(flowSelectionActions.addNode(graphId, nodeId));
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
				const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
				const graph = getActionState().flowState.graphs[graphId];

				const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
				const transformMousePosition = (mousePosition: Vec2) =>
					flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);

				const allNodeInputsOfType = getAllValidInputsForType(graph, nodeId, outputIndex);

				let hasInit = false;

				addListener.repeated("mousemove", (e) => {
					const mousePos = transformMousePosition(Vec2.fromEvent(e));

					if (!hasInit) {
						dispatch(
							flowActions.initDragOutputTo(graphId, mousePos, {
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

					dispatch(flowActions.setDragOutputTo(graphId, mousePos, wouldConnectTo));
				});

				addListener.once("mouseup", () => {
					const graph = getActionState().flowState.graphs[graphId];

					if (graph._dragOutputTo?.wouldConnectToInput) {
						dispatch(flowActions.submitDragOutputTo(graphId));
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
			const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
			const graph = getActionState().flowState.graphs[graphId];

			const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
			const transformMousePosition = (mousePosition: Vec2) =>
				flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);

			const allNodeOutputsOfType = getAllOutputsOfType(graph, nodeId, inputIndex);

			let hasInit = false;

			addListener.repeated("mousemove", (e) => {
				const mousePos = transformMousePosition(Vec2.fromEvent(e));

				if (!hasInit) {
					dispatch(
						flowActions.initDragInputTo(graphId, mousePos, {
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

				dispatch(flowActions.setDragInputTo(graphId, mousePos, wouldConnectTo));
			});

			addListener.once("mouseup", () => {
				const graph = getActionState().flowState.graphs[graphId];

				if (graph._dragInputTo?.wouldConnectToOutput) {
					dispatch(flowActions.submitDragInputTo(graphId));
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
			const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
			const graph = getActionState().flowState.graphs[graphId];

			const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
			const transformMousePosition = (mousePosition: Vec2) =>
				flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);

			const pointer = graph.nodes[nodeId].inputs[inputIndex].pointer;

			if (!pointer) {
				console.warn(`No pointer for '${nodeId}' input at index '${inputIndex}'`);
				cancelAction();
				return;
			}

			const allNodeInputsOfType = getAllValidInputsForType(
				graph,
				pointer.nodeId,
				pointer.outputIndex,
			);

			let hasInit = false;

			addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e).apply(transformMousePosition);

				if (!hasInit) {
					dispatch(flowActions.removeInputPointer(graphId, nodeId, inputIndex));
					dispatch(
						flowActions.initDragOutputTo(graphId, mousePos, {
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

				dispatch(flowActions.setDragOutputTo(graphId, mousePos, wouldConnectTo));
			});

			addListener.once("mouseup", () => {
				const graph = getActionState().flowState.graphs[graphId];

				if (graph._dragOutputTo?.wouldConnectToInput) {
					if (
						graph._dragOutputTo.wouldConnectToInput.inputIndex === inputIndex &&
						graph._dragOutputTo.wouldConnectToInput.nodeId === nodeId
					) {
						cancelAction();
						return;
					}

					dispatch(flowActions.submitDragOutputTo(graphId));
					submitAction("Move input to output");
				} else {
					dispatch(flowActions.clearDragOutputTo(graphId));
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
		const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
		const viewport = getAreaViewport(areaId, AreaType.FlowEditor);

		const transformMousePosition = (mousePosition: Vec2) =>
			flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);

		const initialMousePos = transformMousePosition(Vec2.fromEvent(e));

		requestAction({ history: true }, (params) => {
			const { submitAction, cancelAction, dispatch, addListener } = params;

			const graph = getActionState().flowState.graphs[graphId];

			const node = graph.nodes[nodeId];

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
					FLOW_NODE_MIN_WIDTH,
					Math.round(mousePos.x - node.position.x),
				);
				dispatch(flowActions.setNodeWidth(graphId, nodeId, width));
			});

			addListener.once("mouseup", () => {
				if (!hasMoved) {
					cancelAction();
					return;
				}

				submitAction("Resize node width");
			});
		});
	},
};
