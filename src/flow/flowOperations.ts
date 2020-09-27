import { flowSelectionFromState } from "~/flow/flowUtils";
import { flowActions } from "~/flow/state/flowActions";
import { flowSelectionActions } from "~/flow/state/flowSelectionReducer";
import { getActionState } from "~/state/stateUtils";
import { Operation } from "~/types";

const removeSelectedNodesInGraph = (op: Operation, graphId: string): void => {
	const { flowState, flowSelectionState } = getActionState();

	const graph = flowState.graphs[graphId];
	const selection = flowSelectionFromState(graphId, flowSelectionState);
	const nodeIds = Object.keys(graph.nodes);

	for (const nodeId of nodeIds) {
		if (selection.nodes[nodeId]) {
			op.add(flowActions.removeNode(graphId, nodeId));
			op.add(flowSelectionActions.removeNode(graphId, nodeId));
		}
	}
};

export const flowOperations = {
	removeSelectedNodesInGraph,
};
