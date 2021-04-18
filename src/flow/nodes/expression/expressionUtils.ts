import { FlowState } from "~/flow/state/flowReducers";
import { ExpressionIO } from "~/util/math/expressions";

export const getExpressionUpdateIO = (io: ExpressionIO, flowState: FlowState, nodeId: string) => {
	const node = flowState.nodes[nodeId];
	const graph = flowState.graphs[node.graphId];

	const outputsToRemove: number[] = [];
	const outputsToKeep: number[] = [];
	const outputsToKeepNames = new Set<string>();

	const inputsToRemove: number[] = [];
	const inputsToKeep: number[] = [];
	const inputsToKeepNames = new Set<string>();

	// Populate outputs to remove and keep
	for (let i = 0; i < node.outputs.length; i += 1) {
		const output = node.outputs[i];
		if (io.outputs.indexOf(output.name) === -1) {
			outputsToRemove.push(i);
		} else {
			outputsToKeep.push(i);
			outputsToKeepNames.add(output.name);
		}
	}

	// Populate inputs to remove and keep
	for (let i = 0; i < node.inputs.length; i += 1) {
		const input = node.inputs[i];
		if (io.inputs.indexOf(input.name) === -1) {
			inputsToRemove.push(i);
		} else {
			inputsToKeep.push(i);
			inputsToKeepNames.add(input.name);
		}
	}

	const outputsToAdd = io.outputs.filter((output) => !outputsToKeepNames.has(output));
	const inputsToAdd = io.inputs.filter((input) => !inputsToKeepNames.has(input));

	const oldIndexToNewInputIndex = inputsToKeep.reduce<{ [key: string]: number }>(
		(obj, index, newIndex) => {
			obj[index] = newIndex;
			return obj;
		},
		{},
	);

	const inputsToUpdate: Array<{
		nodeId: string;
		inputIndex: number;
		targetNode: string;
		targetOutputIndex: number;
	}> = [];

	// Populate inputs to update (other than node being updated)
	const nodeIds = graph.nodes;
	for (let i = 0; i < nodeId.length; i += 1) {
		const node = flowState.nodes[nodeIds[i]];

		if (node.id === nodeId) {
			continue;
		}

		for (let j = 0; j < node.inputs.length; j += 1) {
			const input = node.inputs[j];

			if (!input.pointer || input.pointer.nodeId !== nodeId) {
				continue;
			}

			const toRemoveIndex = outputsToRemove.indexOf(input.pointer.outputIndex);
			if (toRemoveIndex === -1) {
				continue;
			}

			inputsToUpdate.push({
				nodeId: node.id,
				inputIndex: j,
				targetNode: nodeId,
				targetOutputIndex: oldIndexToNewInputIndex[input.pointer.outputIndex],
			});
		}
	}

	return {
		graphId: graph.id,
		nodeId,
		outputIndicesToRemove: outputsToRemove,
		outputsToAdd,
		inputIndicesToRemove: inputsToRemove,
		inputsToAdd,
		inputsToUpdate,
	};
};
