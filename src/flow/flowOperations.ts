import { flowSelectionFromState } from "~/flow/flowUtils";
import { flowActions } from "~/flow/state/flowActions";
import { flowSelectionActions } from "~/flow/state/flowSelectionReducer";
import { getActionState } from "~/state/stateUtils";
import { Operation } from "~/types";

const removeSelectedNodesInGraph = (op: Operation, graphId: string): void => {
	const { flowState, flowSelectionState } = getActionState();

	const graph = flowState.graphs[graphId];
	const selection = flowSelectionFromState(graphId, flowSelectionState);
	const nodeIds = graph.nodes;

	for (const nodeId of nodeIds) {
		if (selection.nodes[nodeId]) {
			op.add(flowActions.removeNode(graphId, nodeId));
			op.add(flowSelectionActions.removeNode(graphId, nodeId));
		}
	}
};

const removeGraph = (op: Operation, graphId: string): void => {
	op.add(flowActions.removeGraph(graphId));
	op.add(flowSelectionActions.removeGraph(graphId));
};

export const flowOperations = {
	removeSelectedNodesInGraph,
	removeGraph,
};
