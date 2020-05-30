import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";
import { CompositionLayerProperty } from "~/composition/compositionTypes";
import { ComputeNodeContext, computeNodeOutputArgs } from "~/nodeEditor/graph/computeNode";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";

export const computeLayerGraph = (
	properties: CompositionLayerProperty[],
	graph?: NodeEditorGraphState,
): ((
	context: ComputeNodeContext,
) => {
	[propertyId: string]: number;
}) => {
	const computeRawPropertyValues = (
		context: ComputeNodeContext,
	): { [propertyId: string]: number } => {
		return properties.reduce<{
			[propertyId: string]: number;
		}>((obj, p) => {
			obj[p.id] = p.timelineId
				? getTimelineValueAtIndex(
						context.composition.frameIndex,
						context.timelines[p.timelineId],
						context.timelineSelection[p.timelineId],
				  )
				: p.value;
			return obj;
		}, {});
	};

	if (!graph) {
		return computeRawPropertyValues;
	}

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
		return computeRawPropertyValues;
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
					dfs(graph!.nodes[input.pointer.nodeId]);
				}
			}

			out.push(node.id);
		}

		dfs(node);

		return out;
	};

	const toCompute = getNodes(outputNode);

	return (context: ComputeNodeContext): { [propertyId: string]: number } => {
		for (let i = 0; i < toCompute.length; i += 1) {
			const node = graph.nodes[toCompute[i]];
			context.computed[node.id] = computeNodeOutputArgs(node, context);
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
