import { flowSelectionFromState } from "~/flow/flowUtils";
import { flowActions } from "~/flow/state/flowActions";
import { flowSelectionActions } from "~/flow/state/flowSelectionReducer";
import { Operation } from "~/types";

function selectNode(op: Operation, nodeId: string): void {
	const { flowState, flowSelectionState } = op.state;
	const node = flowState.nodes[nodeId];

	const selection = flowSelectionFromState(node.graphId, flowSelectionState);

	// If the node is selected, do nothing.
	if (!selection.nodes[nodeId]) {
		op.add(flowSelectionActions.setSelectedNodesInGraph(node.graphId, [nodeId]));
	}
}

const removeSelectedNodesInGraph = (op: Operation, graphId: string): void => {
	const { compositionState, flowState, flowSelectionState } = op.state;

	const graph = flowState.graphs[graphId];
	const selection = flowSelectionFromState(graphId, flowSelectionState);
	const nodeIds = graph.nodes;

	for (const nodeId of nodeIds) {
		if (selection.nodes[nodeId]) {
			op.add(flowActions.removeNode(graphId, nodeId));
			op.add(flowSelectionActions.removeNode(graphId, nodeId));
		}
	}

	switch (graph.type) {
		case "layer_graph": {
			op.addDiff((diff) => diff.propertyStructure(graph.layerId));
			break;
		}
		case "array_modifier_graph": {
			const property = compositionState.properties[graph.propertyId];
			op.addDiff((diff) => diff.propertyStructure(property.layerId));
			break;
		}
		default:
			throw new Error(`Unexpected graph type '${graph.type}'.`);
	}
};

const removeGraph = (op: Operation, graphId: string): void => {
	op.add(flowActions.removeGraph(graphId));
	op.add(flowSelectionActions.removeGraph(graphId));
};

const connectOutputToInput = (
	op: Operation,
	outputNodeId: string,
	outputIndex: number,
	inputNodeId: string,
	inputIndex: number,
): void => {
	op.add(flowActions.connectInputToOutput(outputNodeId, outputIndex, inputNodeId, inputIndex));
	op.addDiff((diff) => diff.updateNodeConnection([outputNodeId, inputNodeId]));
};

const removeInputPointer = (op: Operation, inputNodeId: string, inputIndex: number): void => {
	const { flowState } = op.state;
	const node = flowState.nodes[inputNodeId];
	const { nodeId: outputNodeId } = node.inputs[inputIndex].pointer!;

	op.add(flowActions.removeInputPointer(inputNodeId, inputIndex));
	op.addDiff((diff) => diff.updateNodeConnection([outputNodeId, inputNodeId]));
};

export const flowOperations = {
	selectNode,
	removeSelectedNodesInGraph,
	removeGraph,
	connectOutputToInput,
	removeInputPointer,
};
