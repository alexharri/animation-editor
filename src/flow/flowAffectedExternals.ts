import { FlowNodeState } from "~/flow/flowNodeState";
import { FlowNode, FlowNodeAffectedExternals, FlowNodeType } from "~/flow/flowTypes";

export function getFlowNodeAffectedExternals(
	actionState: ActionState,
	node: FlowNode,
): FlowNodeAffectedExternals {
	const { compositionState } = actionState;

	switch (node.type) {
		case FlowNodeType.property_output: {
			const state = node.state as FlowNodeState<FlowNodeType.property_output>;

			if (!state.propertyId) {
				return { propertyIds: [] };
			}

			const targetProperty = compositionState.properties[state.propertyId];

			let propertyIdsByInput: string[][] = [];

			switch (targetProperty.type) {
				case "property":
					propertyIdsByInput.push([targetProperty.id]);
					break;
				case "compound":
					const [xId, yId] = targetProperty.properties;
					propertyIdsByInput.push([xId, yId], [xId], [yId]);
					break;
				case "group": {
					for (const propertyId of targetProperty.properties) {
						const property = compositionState.properties[propertyId];
						switch (property.type) {
							case "property":
								propertyIdsByInput.push([property.id]);
								break;
							case "compound":
								const [xId, yId] = property.properties;
								propertyIdsByInput.push([xId, yId]);
								break;
							case "group":
								break;
						}
					}
					break;
				}
			}

			const propertyIds: string[] = [];

			for (let i = 0; i < node.inputs.length; i++) {
				if (!node.inputs[i].pointer) {
					continue;
				}

				propertyIds.push(...propertyIdsByInput[i]);
			}

			return { propertyIds };
		}
		default:
			return { propertyIds: [] };
	}
}
