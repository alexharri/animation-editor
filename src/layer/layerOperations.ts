import * as PIXI from "pixi.js";
import { compositionActions } from "~/composition/compositionReducer";
import { findLayerTopLevelPropertyGroup } from "~/composition/compositionUtils";
import { constructLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { createPropertyManager } from "~/composition/manager/property/propertyManager";
import { RAD_TO_DEG_FAC } from "~/constants";
import { propertyOperations } from "~/property/propertyOperations";
import { getRealPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";
import { adjustPIXITransformToParent } from "~/render/pixi/pixiTransform";
import { getActionState } from "~/state/stateUtils";
import { Operation, PropertyGroupName, PropertyName } from "~/types";

const setLayerParentLayer = (
	op: Operation,
	actionState: ActionState,
	layerId: string,
	parentId: string,
): void => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];

	const propertyManager = createPropertyManager(layer.compositionId, actionState);
	const map = constructLayerPropertyMap(layerId, compositionState);

	const layerTransform = getRealPixiLayerMatrix(
		actionState,
		layerId,
		propertyManager.getPropertyValue,
	).decompose(new PIXI.Transform());
	const parentTransform = getRealPixiLayerMatrix(
		actionState,
		parentId,
		propertyManager.getPropertyValue,
	).decompose(new PIXI.Transform());

	const transform = adjustPIXITransformToParent(layerTransform, parentTransform);
	const { pivot, position, rotation, scale } = transform;

	op.add(
		compositionActions.setPropertyValue(map[PropertyName.AnchorX], pivot.x),
		compositionActions.setPropertyValue(map[PropertyName.AnchorY], pivot.y),
		compositionActions.setPropertyValue(map[PropertyName.PositionX], position.x),
		compositionActions.setPropertyValue(map[PropertyName.PositionY], position.y),
		compositionActions.setPropertyValue(map[PropertyName.Rotation], rotation * RAD_TO_DEG_FAC),
		compositionActions.setPropertyValue(map[PropertyName.ScaleX], scale.x),
		compositionActions.setPropertyValue(map[PropertyName.ScaleY], scale.y),
		compositionActions.setLayerParentLayerId(layerId, parentId),
	);
};

const removeLayerParentLayer = (op: Operation, actionState: ActionState, layerId: string): void => {
	const { compositionState } = getActionState();
	const layer = compositionState.layers[layerId];

	const propertyManager = createPropertyManager(layer.compositionId, actionState);
	const map = constructLayerPropertyMap(layerId, compositionState);

	const transform = getRealPixiLayerMatrix(
		actionState,
		layerId,
		propertyManager.getPropertyValue,
	).decompose(new PIXI.Transform());
	const { pivot, position, rotation, scale } = transform;

	op.add(
		compositionActions.setPropertyValue(map[PropertyName.AnchorX], pivot.x),
		compositionActions.setPropertyValue(map[PropertyName.AnchorY], pivot.y),
		compositionActions.setPropertyValue(map[PropertyName.PositionX], position.x),
		compositionActions.setPropertyValue(map[PropertyName.PositionY], position.y),
		compositionActions.setPropertyValue(map[PropertyName.Rotation], rotation * RAD_TO_DEG_FAC),
		compositionActions.setPropertyValue(map[PropertyName.ScaleX], scale.x),
		compositionActions.setPropertyValue(map[PropertyName.ScaleY], scale.y),
		compositionActions.setLayerParentLayerId(layerId, ""),
	);
};

const removeArrayModifier = (op: Operation, propertyId: string): void => {
	const { compositionState } = op.state;
	const arrayModifierGroup = compositionState.properties[propertyId];

	if (arrayModifierGroup.name !== PropertyGroupName.ArrayModifier) {
		throw new Error(`Property '${propertyId}' is not an Array Modifier group.`);
	}

	const modifiersGroup = findLayerTopLevelPropertyGroup(
		arrayModifierGroup.layerId,
		compositionState,
		PropertyGroupName.Modifiers,
	);

	propertyOperations.removePropertyFromGroupRecursive(
		op,
		modifiersGroup.id,
		arrayModifierGroup.id,
	);
	op.addDiff((diff) => diff.propertyStructure(modifiersGroup.layerId));
};

export const layerOperations = {
	removeArrayModifier,
	setLayerParentLayer,
	removeLayerParentLayer,
};
