import { FlowNode, FlowNodeType } from "~/flow/flowTypes";

type AffectedBy = "frame" | "container_size" | "other_property";

interface GraphDependency {
	type: "graph_dependency";
	graphId: string;
	outputNodeId: string;
	inputIndex: number; // Index of input on output node that affects property
	propertyId: string; // Apply the computed value to this property
	affectedBy: AffectedBy[];
}

interface TimelineDependency {
	type: "timeline_dependency";
	propertyId: string;
	timelineId: string;
}

export type LayerDependency = GraphDependency | TimelineDependency;

export const getLayerDependencies = (
	actionState: ActionState,
	layerId: string,
): LayerDependency[] => {
	const deps: LayerDependency[] = [];

	const { compositionState, flowState } = actionState;

	const layer = compositionState.layers[layerId];
	const { graphId } = layer;

	if (graphId) {
		const graph = flowState.graphs[graphId];

		const outputNodes: FlowNode<FlowNodeType.property_output>[] = [];
		for (const nodeId of Object.keys(graph.nodes)) {
			const node = graph.nodes[nodeId];
			if (node.type === FlowNodeType.property_output) {
				outputNodes.push(node as FlowNode<FlowNodeType.property_output>);
			}
		}

		// console.log(outputNodes);
		for (const node of outputNodes) {
			let propertyIds: string[];

			const property = compositionState.properties[node.state.propertyId];
			switch (property.type) {
				case "property": {
					propertyIds = [property.id];
					break;
				}
				case "compound": {
					propertyIds = [property.id, ...property.properties];
					break;
				}
				case "group": {
					propertyIds = property.properties;
					break;
				}
				default:
					throw new Error("Unknown property type");
			}

			function findDependencies(
				node: FlowNode<any>,
				outputIndex: number,
				push: (affectedBy: AffectedBy) => void,
			) {
				switch (node.type) {
					case FlowNodeType.property_input: {
						push("other_property");
						break;
					}
					case FlowNodeType.composition: {
						// Width, Height, Frame
						push(outputIndex < 2 ? "container_size" : "frame");
						break;
					}
				}

				for (const input of node.inputs) {
					if (!input.pointer) {
						continue;
					}
					findDependencies(
						graph.nodes[input.pointer.nodeId],
						input.pointer.outputIndex,
						push,
					);
				}
			}

			for (let i = 0; i < node.inputs.length; i++) {
				const input = node.inputs[i];
				if (!input.pointer) {
					continue;
				}

				const affectedBy: AffectedBy[] = [];

				findDependencies(graph.nodes[input.pointer.nodeId], i, (item) =>
					affectedBy.push(item),
				);

				if (affectedBy.length === 0) {
					continue;
				}

				deps.push({
					type: "graph_dependency",
					affectedBy,
					graphId,
					inputIndex: i,
					outputNodeId: node.id,
					propertyId: propertyIds[i],
				});
			}
		}
	}

	return deps;
};
