import { NodeEditorGraphState } from "~/nodeEditor/nodeEditorReducers";
import { NodeEditorNode } from "~/nodeEditor/nodeEditorIO";
import { NodeEditorNodeType } from "~/types";
import { CompositionProperty } from "~/composition/compositionTypes";
import { ComputeNodeContext, computeNodeOutputArgs } from "~/nodeEditor/graph/computeNode";
import { getTimelineValueAtIndex } from "~/timeline/timelineUtils";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";

type Fn = (
	context: ComputeNodeContext,
	graph?: NodeEditorGraphState,
) => {
	[propertyId: string]: {
		computedValue: any;
		rawValue: any;
	};
};

export const computeLayerGraph = (graph?: NodeEditorGraphState): Fn => {
	const computeRawPropertyValues: Fn = (context) => {
		const { compositionState } = context;

		const composition = compositionState.compositions[context.compositionId];
		const properties = getLayerCompositionProperties(context.layerId, compositionState);

		return properties.reduce<{
			[propertyId: string]: {
				computedValue: any;
				rawValue: any;
			};
		}>((obj, p) => {
			const rawValue = p.timelineId
				? getTimelineValueAtIndex(
						composition.frameIndex,
						context.timelines[p.timelineId],
						context.timelineSelection[p.timelineId],
				  )
				: p.value;
			obj[p.id] = {
				rawValue,
				computedValue: rawValue,
			};
			return obj;
		}, {});
	};

	if (!graph) {
		return computeRawPropertyValues;
	}

	const outputNodes: NodeEditorNode<NodeEditorNodeType.property_output>[] = [];

	const keys = Object.keys(graph.nodes);
	for (let i = 0; i < keys.length; i += 1) {
		const node = graph.nodes[keys[i]];
		if (node.type === NodeEditorNodeType.property_output) {
			outputNodes.push(node as NodeEditorNode<NodeEditorNodeType.property_output>);
		}
	}

	if (!outputNodes.length) {
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

	const toComputeArr = outputNodes.map((outputNode) => getNodes(outputNode));

	return (
		context: ComputeNodeContext,

		// The reason we pass `mostRecentGraph` is so that we can access the latest
		// state of the nodes within it (for example num_input `value` state).
		mostRecentGraph: NodeEditorGraphState = graph,
	): {
		[propertyId: string]: {
			computedValue: number;
			rawValue: number;
		};
	} => {
		try {
			for (let i = 0; i < toComputeArr.length; i += 1) {
				const toCompute = toComputeArr[i];

				for (let j = 0; j < toCompute.length; j += 1) {
					const node = graph.nodes[toCompute[j]];
					const mostRecentNode = mostRecentGraph.nodes[toCompute[j]];
					context.computed[node.id] = computeNodeOutputArgs(
						node,
						context,
						mostRecentNode,
					);
				}
			}

			const propertyIdToValue = computeRawPropertyValues(context);

			for (let i = 0; i < outputNodes.length; i += 1) {
				const outputNode = outputNodes[i];

				const selectedProperty =
					context.compositionState.properties[outputNode.state.propertyId];

				if (!selectedProperty) {
					continue;
				}

				const properties =
					selectedProperty.type === "group"
						? selectedProperty.properties
								.map((id) => context.compositionState.properties[id])
								.filter(
									(property): property is CompositionProperty =>
										property.type === "property",
								)
						: [selectedProperty];

				for (let j = 0; j < properties.length; j += 1) {
					const property = properties[j];

					// Do not modify the property:value map if the input does not have
					// a pointer.
					//
					// This allows us to, for example, have two property_output nodes that
					// both reference Transform but modify different properties of the
					// Transform group.
					if (!outputNode.inputs[j].pointer) {
						continue;
					}

					propertyIdToValue[property.id].computedValue =
						context.computed[outputNode.id][j].value;
				}
			}

			return propertyIdToValue;
		} catch (e) {
			console.error(e);
			return {};
		}
	};
};
