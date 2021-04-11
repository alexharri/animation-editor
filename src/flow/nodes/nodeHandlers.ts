import { getAreaViewport } from "~/area/util/getAreaViewport";
import { AreaType, FLOW_NODE_MIN_WIDTH } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { flowAreaActions } from "~/flow/flowAreaActions";
import { flowOperations } from "~/flow/flowOperations";
import {
	didFlowSelectionChange,
	flowEditorGlobalToNormal,
	flowSelectionFromState,
} from "~/flow/flowUtils";
import { flowActions } from "~/flow/state/flowActions";
import { flowSelectionActions } from "~/flow/state/flowSelectionReducer";
import {
	getFlowGraphAvailableInputs,
	getFlowGraphAvailableOutputs,
} from "~/flow/util/flowNodeAvailableIO";
import {
	calculateNodeInputPosition,
	calculateNodeOutputPosition,
} from "~/flow/util/flowNodeHeight";
import { isKeyDown } from "~/listener/keyboard";
import { requestAction } from "~/listener/requestAction";
import { createOperation, performOperation } from "~/state/operation";
import { getActionState, getAreaActionState } from "~/state/stateUtils";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";
import { getDistance } from "~/util/math";

const NODE_MIN_DIST = 10;

export const nodeHandlers = {
	onRightClick: (e: React.MouseEvent, graphId: string, nodeId: string) => {
		requestAction({ history: true }, (params) => {
			performOperation(params, (op) => flowOperations.selectNode(op, nodeId));

			params.dispatch(
				contextMenuActions.openContextMenu(
					"Node",
					[
						{
							label: "Delete node(s)",
							onSelect: () => {
								const op = createOperation(params);
								flowOperations.removeSelectedNodesInGraph(op, graphId);
								op.submit();

								params.dispatch(contextMenuActions.closeContextMenu());
								params.submitAction("Remove selected nodes");
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
		e: React.MouseEvent,
		areaId: string,
		graphId: string,
		outputNodeId: string,
		outputIndex: number,
	) => {
		const { flowState } = getActionState();
		const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
		const viewport = getAreaViewport(areaId, AreaType.FlowEditor);

		const globalToNormal = (vec: Vec2) => flowEditorGlobalToNormal(vec, viewport, scale, pan);

		const fromPos = calculateNodeOutputPosition(flowState.nodes[outputNodeId], outputIndex);

		const availableInputs = getFlowGraphAvailableInputs(
			flowState,
			graphId,
			outputNodeId,
			outputIndex,
		);
		const inputPositions = availableInputs.map(({ inputNodeId: nodeId, inputIndex }) => {
			const node = flowState.nodes[nodeId];
			return calculateNodeInputPosition(node, inputIndex);
		});
		let toIndex = -1;

		mouseDownMoveAction(e, {
			keys: [],
			translate: globalToNormal,
			beforeMove: () => {},
			mouseMove: (params, { mousePosition }) => {
				let dist = -1;
				toIndex = -1;

				for (let i = 0; i < availableInputs.length; i += 1) {
					const currDist = getDistance(inputPositions[i], mousePosition.normal) / scale;

					if ((dist === -1 || currDist < dist) && currDist < NODE_MIN_DIST / scale) {
						dist = currDist;
						toIndex = i;
					}
				}

				const toPos = toIndex === -1 ? mousePosition.normal : inputPositions[toIndex];
				params.dispatchToAreaState(
					areaId,
					flowAreaActions.setFields({ dragPreview: [fromPos, toPos] }),
				);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved || toIndex === -1) {
					params.cancelAction();
					return;
				}

				const { inputNodeId, inputIndex } = availableInputs[toIndex];
				performOperation(params, (op) =>
					flowOperations.connectOutputToInput(
						op,
						outputNodeId,
						outputIndex,
						inputNodeId,
						inputIndex,
					),
				);
				params.dispatchToAreaState(
					areaId,
					flowAreaActions.setFields({ dragPreview: null }),
				);
				params.submitAction("Connect output to input");
			},
		});
	},

	onInputMouseDown: (
		e: React.MouseEvent,
		areaId: string,
		graphId: string,
		inputNodeId: string,
		inputIndex: number,
	) => {
		const { flowState } = getActionState();
		const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
		const viewport = getAreaViewport(areaId, AreaType.FlowEditor);

		const globalToNormal = (vec: Vec2) => flowEditorGlobalToNormal(vec, viewport, scale, pan);

		const fromPos = calculateNodeInputPosition(flowState.nodes[inputNodeId], inputIndex);

		const availableOutputs = getFlowGraphAvailableOutputs(
			flowState,
			graphId,
			inputNodeId,
			inputIndex,
		);
		const outputPositions = availableOutputs.map(({ outputNodeId: nodeId, outputIndex }) => {
			const node = flowState.nodes[nodeId];
			return calculateNodeOutputPosition(node, outputIndex);
		});
		let toIndex = -1;

		mouseDownMoveAction(e, {
			keys: [],
			translate: globalToNormal,
			beforeMove: () => {},
			mouseMove: (params, { mousePosition }) => {
				let dist = -1;
				toIndex = -1;

				for (let i = 0; i < availableOutputs.length; i += 1) {
					const currDist = getDistance(outputPositions[i], mousePosition.normal) / scale;

					if ((dist === -1 || currDist < dist) && currDist < NODE_MIN_DIST / scale) {
						dist = currDist;
						toIndex = i;
					}
				}

				const toPos = toIndex === -1 ? mousePosition.normal : outputPositions[toIndex];
				params.dispatchToAreaState(
					areaId,
					flowAreaActions.setFields({ dragPreview: [fromPos, toPos] }),
				);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved || toIndex === -1) {
					params.cancelAction();
					return;
				}

				const { outputNodeId, outputIndex } = availableOutputs[toIndex];
				performOperation(params, (op) =>
					flowOperations.connectOutputToInput(
						op,
						outputNodeId,
						outputIndex,
						inputNodeId,
						inputIndex,
					),
				);
				params.dispatchToAreaState(
					areaId,
					flowAreaActions.setFields({ dragPreview: null }),
				);
				params.submitAction("Connect input to output");
			},
		});
	},

	onInputWithPointerMouseDown: (
		e: React.MouseEvent,
		areaId: string,
		graphId: string,
		nodeId: string,
		inputIndex: number,
	) => {
		const { flowState } = getActionState();
		const { pan, scale } = getAreaActionState<AreaType.FlowEditor>(areaId);
		const viewport = getAreaViewport(areaId, AreaType.FlowEditor);

		const node = flowState.nodes[nodeId];
		const input = node.inputs[inputIndex];
		const { outputIndex, nodeId: outputNodeId } = input.pointer!;
		const globalToNormal = (vec: Vec2) => flowEditorGlobalToNormal(vec, viewport, scale, pan);

		const fromPos = calculateNodeOutputPosition(flowState.nodes[outputNodeId], outputIndex);

		const availableInputs = getFlowGraphAvailableInputs(
			flowState,
			graphId,
			outputNodeId,
			outputIndex,
		);
		const inputPositions = availableInputs.map(({ inputNodeId: nodeId, inputIndex }) => {
			const node = flowState.nodes[nodeId];
			return calculateNodeInputPosition(node, inputIndex);
		});
		let toIndex = -1;

		mouseDownMoveAction(e, {
			keys: [],
			translate: globalToNormal,
			beforeMove: () => {},
			mouseMove: (params, { firstMove, mousePosition }) => {
				if (firstMove) {
					performOperation(params, (op) =>
						flowOperations.removeInputPointer(op, nodeId, inputIndex),
					);
				}

				let dist = -1;
				toIndex = -1;

				for (let i = 0; i < availableInputs.length; i += 1) {
					const currDist = getDistance(inputPositions[i], mousePosition.normal) / scale;

					if ((dist === -1 || currDist < dist) && currDist < NODE_MIN_DIST / scale) {
						dist = currDist;
						toIndex = i;
					}
				}

				const toPos = toIndex === -1 ? mousePosition.normal : inputPositions[toIndex];
				params.dispatchToAreaState(
					areaId,
					flowAreaActions.setFields({ dragPreview: [fromPos, toPos] }),
				);
			},
			mouseUp: (params, hasMoved) => {
				if (!hasMoved) {
					params.cancelAction();
					return;
				}

				params.dispatchToAreaState(
					areaId,
					flowAreaActions.setFields({ dragPreview: null }),
				);

				if (toIndex === -1) {
					params.submitAction("Disconnect input from output");
					return;
				}

				const { inputNodeId, inputIndex } = availableInputs[toIndex];
				performOperation(params, (op) =>
					flowOperations.connectOutputToInput(
						op,
						outputNodeId,
						outputIndex,
						inputNodeId,
						inputIndex,
					),
				);
				params.submitAction("Connect output to input");
			},
		});
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
