import { PropertyStore } from "~/composition/manager/property/propertyStore";
import { FlowComputeNodeArg, FlowNode, FlowNodeType } from "~/flow/flowTypes";

export const recomputePropertyValuesAffectedByNode = (
	node: FlowNode<FlowNodeType.property_output>,
	actionState: ActionState,
	propertyStore: PropertyStore,
	nodeOutputMap: Record<string, FlowComputeNodeArg[]>,
) => {
	const { compositionState } = actionState;
	const state = node.state;

	if (!state.propertyId) {
		// The node has not selected a property.
		return;
	}

	const outputs = nodeOutputMap[node.id];
	const targetProperty = compositionState.properties[state.propertyId];

	let propertyIds: string[];

	if (targetProperty.type === "property") {
		propertyIds = [targetProperty.id];
	} else if (targetProperty.type === "compound") {
		const [xId, yId] = targetProperty.properties;
		propertyIds = [targetProperty.id, xId, yId];
	} else {
		propertyIds = targetProperty.properties.filter(
			(propertyId) => compositionState.properties[propertyId].type !== "group",
		);
	}

	for (let i = 0; i < node.inputs.length; i++) {
		const input = node.inputs[i];
		if (!input.pointer) {
			continue;
		}
		const propertyId = propertyIds[i];
		const property = compositionState.properties[propertyId];

		let { value } = outputs[i];

		if (property.type === "compound") {
			if (typeof value === "number") {
				// If the value provided to a compound property (Vec2) is a number
				// then we case it to Vec2(N, N).
				value = Vec2.new(value, value);
			}

			if (!(value instanceof Vec2)) {
				throw new Error("Expected compound property value to be Vec2");
			}

			const { x, y } = value;
			const [xId, yId] = property.properties;
			propertyStore.setComputedPropertyValue(xId, x);
			propertyStore.setComputedPropertyValue(yId, y);
		} else {
			propertyStore.setComputedPropertyValue(propertyId, value);
		}
	}
};
