import { Property } from "~/composition/compositionTypes";
import { FlowNode, FlowNodeType } from "~/flow/flowTypes";

interface GraphDependency {
	type: "graph_dependency";
	graphId: string;
	outputNodeId: string;
	inputIndex: number; // Index of input that related to the property
	affectedBy: "frame" | "container_size" | "other_property";
}

interface TimelineDependency {
	type: "timeline_dependency";
	timelineId: string;
}

type PropertyDependency = GraphDependency | TimelineDependency;

export const getPropertyDependencies = (
	actionState: ActionState,
	propertyId: string,
): PropertyDependency[] => {
	const deps: PropertyDependency[] = [];

	const { compositionState, flowState } = actionState;

	const property = compositionState.properties[propertyId] as Property;

	if (property.timelineId) {
		deps.push({
			type: "timeline_dependency",
			timelineId: property.timelineId,
		});
	}

	const layer = compositionState.layers[property.layerId];
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

		for (const node of outputNodes) {
			let propertyIds: string[];

			const property = compositionState.properties[node.state.propertyId];
			switch (property.type) {
				case "property": {
					propertyIds = [property.id];
					break;
				}
				case "compound": {
					propertyIds = property.properties;
					break;
				}
				case "group": {
					propertyIds = [];
					for (const propertyId of property.properties) {
						const property = compositionState.properties[propertyId];
						if (property.type === "compound") {
							propertyIds.push(...property.properties);
							continue;
						}

						if (property.type === "property") {
							propertyIds.push(property.id);
						}
					}
					break;
				}
				default:
					throw new Error("Unknown property type");
			}

			if (propertyIds.indexOf(property.id) === -1) {
				// Does not affect this property
				continue;
			}

			function findDependencies(
				node: FlowNode<any>,
				outputIndex: number,
				outputNodeId: string,
				inputIndex: number,
			) {
				switch (node.type) {
					case FlowNodeType.property_input: {
						deps.push({
							type: "graph_dependency",
							affectedBy: "other_property",
							graphId,
							inputIndex,
							outputNodeId,
						});
						break;
					}
					case FlowNodeType.composition: {
						// Width, Height, Frame
						deps.push({
							type: "graph_dependency",
							affectedBy: outputIndex < 2 ? "container_size" : "frame",
							graphId,
							inputIndex,
							outputNodeId,
						});
					}
				}

				for (const input of node.inputs) {
					if (!input.pointer) {
						continue;
					}
					findDependencies(
						graph.nodes[input.pointer.nodeId],
						input.pointer.outputIndex,
						outputNodeId,
						inputIndex,
					);
				}
			}

			for (let i = 0; i < node.inputs.length; i++) {
				const input = node.inputs[i];
				if (!input.pointer) {
					continue;
				}

				findDependencies(graph.nodes[input.pointer.nodeId], i, node.id, i);
			}
		}
	}

	return deps;
};
