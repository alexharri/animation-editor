import { compositionActions } from "~/composition/compositionReducer";
import { flowOperations } from "~/flow/flowOperations";
import { timelineOperations } from "~/timeline/operations/timelineOperations";
import { Operation, PropertyGroupName } from "~/types";

const removeDataRelatedToProperty = (op: Operation, propertyId: string) => {
	const { compositionState } = op.state;
	const property = compositionState.properties[propertyId];

	if (property.name === PropertyGroupName.ArrayModifier) {
		if (property.graphId) {
			flowOperations.removeGraph(op, property.graphId);
		}
	}

	if (property.type === "property") {
		if (property.timelineId) {
			timelineOperations.removeTimeline(op, property.timelineId);
		}
	}
};

const removeProperty = (op: Operation, propertyId: string) => {
	op.add(compositionActions.removeProperty(propertyId));
	removeDataRelatedToProperty(op, propertyId);
};

const removePropertyFromGroupRecursive = (
	op: Operation,
	groupId: string,
	propertyId: string,
): void => {
	const { compositionState } = op.state;
	const group = compositionState.properties[groupId];
	const property = compositionState.properties[propertyId];

	if (group.type !== "group" && group.type !== "compound") {
		// Compound properties are a type of group
		throw new Error(`Property '${propertyId}' is not a property group.`);
	}

	if (property.type === "group" || property.type === "compound") {
		for (const propertyId of property.properties) {
			removePropertyFromGroupRecursive(op, property.id, propertyId);
		}
	}

	removeProperty(op, propertyId);
	op.add(compositionActions.removePropertyFromGroup(groupId, propertyId));
};

export const propertyOperations = {
	removePropertyFromGroupRecursive,
};
