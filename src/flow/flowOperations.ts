import { flowSelectionFromState } from "~/flow/flowUtils";
import {
	getValueTypeCanConvertToValueTypes,
	getValueTypesThatCanConvertToValueType,
} from "~/flow/flowValueConversion";
import { flowActions } from "~/flow/state/flowActions";
import { flowSelectionActions } from "~/flow/state/flowSelectionReducer";
import { Operation, ValueType } from "~/types";

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

const setInputValueType = (
	op: Operation,
	inputNodeId: string,
	inputIndex: number,
	valueType: ValueType,
): void => {
	const { flowState } = op.state;
	const node = flowState.nodes[inputNodeId];

	const affectedNodeIds = [inputNodeId];
	const compatibleOutputValueTypes = getValueTypesThatCanConvertToValueType(valueType);

	const pointer = node.inputs[inputIndex].pointer;
	if (pointer) {
		const output = flowState.nodes[pointer.nodeId].outputs[pointer.outputIndex];
		if (!compatibleOutputValueTypes.has(output.type)) {
			op.add(flowActions.removeInputPointer(inputNodeId, inputIndex));
			affectedNodeIds.push(pointer.nodeId);
		}
	}

	op.add(flowActions.setNodeInputType(inputNodeId, inputIndex, valueType));
	op.addDiff((diff) => diff.updateNodeConnection(affectedNodeIds));
};

const setOutputValueType = (
	op: Operation,
	outputNodeId: string,
	outputIndex: number,
	valueType: ValueType,
): void => {
	const { flowState } = op.state;
	const node = flowState.nodes[outputNodeId];
	const graph = flowState.graphs[node.graphId];

	const affectedNodeIds = [outputNodeId];
	const compatibleInputValueTypes = getValueTypeCanConvertToValueTypes(valueType);

	for (const nodeId of graph.nodes) {
		const node = flowState.nodes[nodeId];

		for (const [inputIndex, input] of node.inputs.entries()) {
			if (
				!input.pointer ||
				input.pointer.nodeId !== outputNodeId ||
				input.pointer.outputIndex !== outputIndex
			) {
				continue;
			}

			if (compatibleInputValueTypes.has(input.type)) {
				continue;
			}

			op.add(flowActions.removeInputPointer(nodeId, inputIndex));
			affectedNodeIds.push(nodeId);
		}
	}

	op.add(flowActions.setNodeOutputType(outputNodeId, outputIndex, valueType));
	op.addDiff((diff) => diff.updateNodeConnection(affectedNodeIds));
};

export const flowOperations = {
	selectNode,
	removeSelectedNodesInGraph,
	removeGraph,
	connectOutputToInput,
	removeInputPointer,
	setInputValueType,
	setOutputValueType,
};
