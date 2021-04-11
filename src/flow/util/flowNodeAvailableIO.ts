import {
	getValueTypeCanConvertToValueTypes,
	getValueTypesThatCanConvertToValueType,
} from "~/flow/flowValueConversion";
import { FlowState } from "~/flow/state/flowReducers";

interface AvailableInput {
	inputNodeId: string;
	inputIndex: number;
}
interface AvailableOutput {
	outputNodeId: string;
	outputIndex: number;
}

function findNodesThatNodeReferences(flowState: FlowState, nodeId: string): Set<string> {
	const visited = new Set<string>();

	function dfs(nodeId: string) {
		if (visited.has(nodeId)) {
			return;
		}
		visited.add(nodeId);

		const node = flowState.nodes[nodeId];
		for (const input of node.inputs) {
			if (!input.pointer) {
				continue;
			}
			dfs(input.pointer.nodeId);
		}
	}
	dfs(nodeId);

	return visited;
}

function findNodesThatReferenceNode(flowState: FlowState, nodeId: string): Set<string> {
	const visited = new Set<string>();

	const nodeToNext: Record<string, Set<string>> = {};

	const graph = flowState.graphs[flowState.nodes[nodeId].graphId];
	for (const nodeId of graph.nodes) {
		nodeToNext[nodeId] = new Set();
	}

	for (const nodeId of graph.nodes) {
		const node = flowState.nodes[nodeId];
		for (const input of node.inputs) {
			if (!input.pointer) {
				continue;
			}

			nodeToNext[input.pointer.nodeId].add(nodeId);
		}
	}

	function dfs(nodeId: string) {
		if (visited.has(nodeId)) {
			return;
		}
		visited.add(nodeId);

		for (const id of [...nodeToNext[nodeId]]) {
			dfs(id);
		}
	}
	dfs(nodeId);

	return visited;
}

export const getFlowGraphAvailableInputs = (
	flowState: FlowState,
	graphId: string,
	nodeId: string,
	outputIndex: number,
): AvailableInput[] => {
	const availableInputs: AvailableInput[] = [];

	const graph = flowState.graphs[graphId];
	const node = flowState.nodes[nodeId];
	const valueType = node.outputs[outputIndex].type;

	const canConvertToTypes = getValueTypeCanConvertToValueTypes(valueType);

	const disallowedNodeIds = findNodesThatNodeReferences(flowState, nodeId);

	for (const nodeId of graph.nodes) {
		if (disallowedNodeIds.has(nodeId)) {
			continue;
		}

		for (const [inputIndex, input] of flowState.nodes[nodeId].inputs.entries()) {
			if (!canConvertToTypes.has(input.type)) {
				continue;
			}

			availableInputs.push({ inputNodeId: nodeId, inputIndex });
		}
	}

	return availableInputs;
};

export const getFlowGraphAvailableOutputs = (
	flowState: FlowState,
	graphId: string,
	nodeId: string,
	inputIndex: number,
): AvailableOutput[] => {
	const availableOutputs: AvailableOutput[] = [];

	const graph = flowState.graphs[graphId];
	const node = flowState.nodes[nodeId];
	const valueType = node.inputs[inputIndex].type;
	const typesThatCanConvertToType = getValueTypesThatCanConvertToValueType(valueType);

	const disallowedNodeIds = findNodesThatReferenceNode(flowState, nodeId);

	for (const nodeId of graph.nodes) {
		if (disallowedNodeIds.has(nodeId)) {
			continue;
		}

		for (const [outputIndex, output] of flowState.nodes[nodeId].outputs.entries()) {
			if (!typesThatCanConvertToType.has(output.type)) {
				continue;
			}

			availableOutputs.push({ outputNodeId: nodeId, outputIndex });
		}
	}

	return availableOutputs;
};
