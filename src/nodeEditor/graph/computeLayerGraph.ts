import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";
import { CompositionLayerProperty, CompositionLayer } from "~/composition/compositionTypes";
import {
	ComputeNodeContext,
	computeNodeOutputArgs,
	ComputeNodeArg,
} from "~/nodeEditor/graph/computeNode";

export const computeLayerGraph = (
	_layer: CompositionLayer,
	properties: CompositionLayerProperty[],
	graph: NodeEditorGraphState,
): ((
	context: ComputeNodeContext,
) => {
	[propertyId: string]: number;
}) => {
	console.log("Calling computeLayerGraph");

	let outputNode: NodeEditorNode<NodeEditorNodeType.layer_output> | undefined;

	const keys = Object.keys(graph.nodes);
	for (let i = 0; i < keys.length; i += 1) {
		const node = graph.nodes[keys[i]];
		if (node.type === NodeEditorNodeType.layer_output) {
			if (outputNode) {
				console.warn(`More than one '${NodeEditorNodeType.layer_output}' node in graph`);
			} else {
				outputNode = node as NodeEditorNode<NodeEditorNodeType.layer_output>;
			}
		}
	}

	if (!outputNode) {
		return () => ({});
	}

	const getNodes = (node: NodeEditorNode<any>) => {
		const out: string[] = [];

		const visitedNodes = new Set<string>();

		function dfs(node: NodeEditorNode<any>) {
			if (visitedNodes.has(node.id)) {
				return;
			}

			visitedNodes.add(node.id);

			for (let i = 0; i < node.inputs.length; i += 1) {
				const input = node.inputs[i];

				if (input.pointer) {
					dfs(graph.nodes[input.pointer.nodeId]);
				}
			}

			out.push(node.id);
		}

		dfs(node);

		return out;
	};

	const toCompute = getNodes(outputNode);

	return function computeGraphValues(
		context: ComputeNodeContext,
	): {
		[propertyId: string]: number;
	} {
		for (let i = 0; i < toCompute.length; i += 1) {
			const node = graph.nodes[toCompute[i]];
			context.computed[node.id] = computeNodeOutputArgs(node, context);
			console.log(context.computed);
		}

		return context.computed[outputNode!.id]
			.map((x) => x.value)
			.reduce<{
				[propertyId: string]: number;
			}>((obj, value, i) => {
				const p = properties[i];
				obj[p.id] = value;
				return obj;
			}, {});
	};
};
