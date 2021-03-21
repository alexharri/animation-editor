import * as PIXI from "pixi.js";
import { compositionActions } from "~/composition/compositionReducer";
import { createPropertyManager } from "~/composition/manager/property/propertyManager";
import { getLayerTransformProperties } from "~/composition/transformUtils";
import { RAD_TO_DEG_FAC } from "~/constants";
import { getRealPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";
import { adjustPIXITransformToParent } from "~/render/pixi/pixiTransform";
import { getActionState } from "~/state/stateUtils";
import { Operation } from "~/types";

const setLayerParentLayer = (
	op: Operation,
	actionState: ActionState,
	layerId: string,
	parentId: string,
): void => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];

	const propertyManager = createPropertyManager(layer.compositionId, actionState);

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

	const properties = getLayerTransformProperties(layerId, compositionState);

	op.add(
		compositionActions.setPropertyValue(properties.anchorX.id, pivot.x),
		compositionActions.setPropertyValue(properties.anchorY.id, pivot.y),
		compositionActions.setPropertyValue(properties.positionX.id, position.x),
		compositionActions.setPropertyValue(properties.positionY.id, position.y),
		compositionActions.setPropertyValue(properties.rotation.id, rotation * RAD_TO_DEG_FAC),
		compositionActions.setPropertyValue(properties.scaleX.id, scale.x),
		compositionActions.setPropertyValue(properties.scaleY.id, scale.y),
		compositionActions.setLayerParentLayerId(layerId, parentId),
	);
};
const removeLayerParentLayer = (op: Operation, actionState: ActionState, layerId: string): void => {
	const { compositionState } = getActionState();
	const layer = compositionState.layers[layerId];

	const propertyManager = createPropertyManager(layer.compositionId, actionState);

	const transform = getRealPixiLayerMatrix(
		actionState,
		layerId,
		propertyManager.getPropertyValue,
	).decompose(new PIXI.Transform());
	const { pivot, position, rotation, scale } = transform;

	const properties = getLayerTransformProperties(layerId, compositionState);

	op.add(
		compositionActions.setPropertyValue(properties.anchorX.id, pivot.x),
		compositionActions.setPropertyValue(properties.anchorY.id, pivot.y),
		compositionActions.setPropertyValue(properties.positionX.id, position.x),
		compositionActions.setPropertyValue(properties.positionY.id, position.y),
		compositionActions.setPropertyValue(properties.rotation.id, rotation * RAD_TO_DEG_FAC),
		compositionActions.setPropertyValue(properties.scaleX.id, scale.x),
		compositionActions.setPropertyValue(properties.scaleY.id, scale.y),
		compositionActions.setLayerParentLayerId(layerId, ""),
	);
};

export const layerOperations = {
	setLayerParentLayer,
	removeLayerParentLayer,
};
