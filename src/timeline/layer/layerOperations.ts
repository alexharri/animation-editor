import * as PIXI from "pixi.js";
import { compositionActions } from "~/composition/compositionReducer";
import { constructLayerPropertyMap } from "~/composition/layer/layerPropertyMap";
import { createPropertyManager } from "~/composition/manager/property/propertyManager";
import { RAD_TO_DEG_FAC } from "~/constants";
import { getRealPixiLayerMatrix } from "~/render/pixi/pixiLayerTransform";
import { adjustPIXITransformToParent } from "~/render/pixi/pixiTransform";
import { getActionState } from "~/state/stateUtils";
import { Operation, PropertyName } from "~/types";

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

export const layerOperations = {
	setLayerParentLayer,
	removeLayerParentLayer,
};
