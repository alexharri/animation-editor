import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType, FLOW_NODE_MIN_WIDTH } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { flowValidInputsToOutputsMap } from "~/flow/flowIO";
import {
	didFlowSelectionChange,
	flowEditorGlobalToNormal,
	flowSelectionFromState,
} from "~/flow/flowUtils";
import { flowActions } from "~/flow/state/flowActions";
import { FlowState } from "~/flow/state/flowReducers";
import { flowSelectionActions } from "~/flow/state/flowSelectionReducer";
import {
	calculateNodeInputPosition,
	calculateNodeOutputPosition,
} from "~/flow/util/flowNodeHeight";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction, RequestActionCallback } from "~/listener/requestAction";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { getDistance } from "~/util/math";

const getAllValidInputsForType = (flowState: FlowState, nodeId: string, outputIndex: number) => {
	const allNodeInputsOfType: Array<{
		nodeId: string;
		inputIndex: number;
		position: Vec2;
	}> = [];

	const node = flowState.nodes[nodeId];
	const graph = flowState.graphs[node.graphId];
	const output = node.outputs[outputIndex];

	for (const key of graph.nodes) {
		if (key === nodeId) {
			continue;
		}

		const node = flowState.nodes[key];

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

const getAllOutputsOfType = (flowState: FlowState, nodeId: string, inputIndex: number) => {
	const allNodeOutputsOfType: Array<{
		nodeId: string;
		outputIndex: number;
		position: Vec2;
	}> = [];

	const node = flowState.nodes[nodeId];
	const graph = flowState.graphs[node.graphId];
	const input = node.inputs[inputIndex];

	for (const key of graph.nodes) {
		if (key === nodeId) {
			continue;
		}

		const node = flowState.nodes[key];

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
								params.addDiff((diff) => diff.removeFlowNode(nodeId));
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
					dispatch(flowSelectionActions.removeGraph(graphId));
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
							dispatch(flowSelectionActions.removeGraph(graphId));
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
		requestAction({ history: true }, (params) => {
			const { flowState } = getActionState();
			const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);

			const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
			const transformMousePosition = (mousePosition: Vec2) =>
				flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);

			const allNodeInputsOfType = getAllValidInputsForType(flowState, nodeId, outputIndex);

			let hasInit = false;

			params.addListener.repeated("mousemove", (e) => {
				const mousePos = transformMousePosition(Vec2.fromEvent(e));

				if (!hasInit) {
					params.dispatch(
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

				params.dispatch(flowActions.setDragOutputTo(graphId, mousePos, wouldConnectTo));
			});

			params.addListener.once("mouseup", () => {
				const graph = getActionState().flowState.graphs[graphId];

				if (graph._dragOutputTo?.wouldConnectToInput) {
					const from = nodeId;
					const to = graph._dragOutputTo?.wouldConnectToInput.nodeId;

					params.dispatch(flowActions.submitDragOutputTo(graphId));
					params.addDiff((diff) => diff.updateNodeConnection([from, to]));
					params.submitAction("Connect output to input");
					return;
				}

				params.cancelAction();
			});
		});
	},

	onInputMouseDown: (
		_: React.MouseEvent,
		areaId: string,
		graphId: string,
		nodeId: string,
		inputIndex: number,
	) => {
		const cb: RequestActionCallback = (params) => {
			const { flowState } = getActionState();
			const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);

			const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
			const transformMousePosition = (mousePosition: Vec2) =>
				flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);

			const allNodeOutputsOfType = getAllOutputsOfType(flowState, nodeId, inputIndex);

			let hasInit = false;

			params.addListener.repeated("mousemove", (e) => {
				const mousePos = transformMousePosition(Vec2.fromEvent(e));

				if (!hasInit) {
					params.dispatch(
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

				params.dispatch(flowActions.setDragInputTo(graphId, mousePos, wouldConnectTo));
			});

			params.addListener.once("mouseup", () => {
				const graph = getActionState().flowState.graphs[graphId];

				if (graph._dragInputTo?.wouldConnectToOutput) {
					const from = nodeId;
					const to = graph._dragInputTo?.wouldConnectToOutput.nodeId;

					params.dispatch(flowActions.submitDragInputTo(graphId));
					params.addDiff((diff) => diff.updateNodeConnection([from, to]));
					params.submitAction("Connect input to output");
					return;
				}

				params.cancelAction();
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
		const cb: RequestActionCallback = (params) => {
			const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
			const { flowState } = getActionState();

			const viewport = getAreaViewport(areaId, AreaType.FlowEditor);
			const transformMousePosition = (mousePosition: Vec2) =>
				flowEditorGlobalToNormal(mousePosition, viewport, scale, pan);

			const node = flowState.nodes[nodeId];
			const pointer = node.inputs[inputIndex].pointer;

			if (!pointer) {
				console.warn(`No pointer for '${nodeId}' input at index '${inputIndex}'`);
				params.cancelAction();
				return;
			}

			const allNodeInputsOfType = getAllValidInputsForType(
				flowState,
				pointer.nodeId,
				pointer.outputIndex,
			);

			const from = nodeId;
			const toPrev = pointer.nodeId;

			let hasInit = false;

			params.addListener.repeated("mousemove", (e) => {
				const mousePos = Vec2.fromEvent(e).apply(transformMousePosition);

				if (!hasInit) {
					params.dispatch(flowActions.removeInputPointer(graphId, nodeId, inputIndex));
					params.dispatch(
						flowActions.initDragOutputTo(graphId, mousePos, {
							outputIndex: pointer.outputIndex,
							nodeId: pointer.nodeId,
						}),
					);
					params.performDiff((diff) => diff.updateNodeConnection([from, toPrev]));
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

				params.dispatch(flowActions.setDragOutputTo(graphId, mousePos, wouldConnectTo));
			});

			params.addListener.once("mouseup", () => {
				const graph = getActionState().flowState.graphs[graphId];

				if (!graph._dragOutputTo) {
					params.cancelAction();
					return;
				}

				if (graph._dragOutputTo.wouldConnectToInput) {
					if (
						graph._dragOutputTo.wouldConnectToInput.inputIndex === inputIndex &&
						graph._dragOutputTo.wouldConnectToInput.nodeId === nodeId
					) {
						params.cancelAction();
						return;
					}
					const toNext = graph._dragOutputTo.wouldConnectToInput.nodeId;

					params.dispatch(flowActions.submitDragOutputTo(graphId));
					params.addDiff((diff) => diff.updateNodeConnection([from, toPrev, toNext]));
					params.submitAction("Move input to output");
				} else {
					params.dispatch(flowActions.clearDragOutputTo(graphId));
					params.addDiff((diff) => diff.updateNodeConnection([from, toPrev]));
					params.submitAction("Disconnect input");
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
			const { flowState } = getActionState();

			const node = flowState.nodes[nodeId];

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
