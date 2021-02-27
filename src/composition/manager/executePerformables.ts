import {
	createLayerInstances,
	updateLayerInstanceTransforms,
} from "~/composition/layer/layerInstances";
import { CompositionManager } from "~/composition/manager/compositionManager";
import { DEG_TO_RAD_FAC } from "~/constants";
import { Performable, PropertyName, TransformPropertyName } from "~/types";

export const executePerformables = (
	ctx: CompositionManager,
	actionState: ActionState,
	layerId: string,
	performables: Performable[],
) => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];
	const layerPropertyMap = ctx.layers.getLayerPropertyMap(layerId);

	const getPropertyValueByName = (name: TransformPropertyName): any => {
		return ctx.properties.getPropertyValue(layerPropertyMap[name]);
	};

	for (const performable of performables) {
		switch (performable) {
			case Performable.DrawLayer: {
				ctx.graphics.updateLayerGraphic(actionState, layer);
				ctx.layers.updateLayerGuides(actionState, layerId);
				break;
			}
			case Performable.UpdatePosition: {
				const container = ctx.layers.getLayerTransformContainer(layerId);
				const x = getPropertyValueByName(PropertyName.PositionX);
				const y = getPropertyValueByName(PropertyName.PositionY);
				container.position.set(x, y);

				ctx.layers.updateLayerGuides(actionState, layerId);
				break;
			}
			case Performable.UpdateTransform: {
				const container = ctx.layers.getLayerTransformContainer(layerId);

				const xPos = getPropertyValueByName(PropertyName.PositionX);
				const yPos = getPropertyValueByName(PropertyName.PositionY);
				const xAnchor = getPropertyValueByName(PropertyName.AnchorX);
				const yAnchor = getPropertyValueByName(PropertyName.AnchorY);
				const xScale = getPropertyValueByName(PropertyName.ScaleX);
				const yScale = getPropertyValueByName(PropertyName.ScaleY);
				const rotation = getPropertyValueByName(PropertyName.Rotation);

				container.position.set(xPos, yPos);
				container.scale.set(xScale, yScale);
				container.pivot.set(xAnchor, yAnchor);
				container.rotation = rotation * DEG_TO_RAD_FAC;

				ctx.layers.updateLayerGuides(actionState, layerId);
				break;
			}
			case Performable.UpdateArrayModifierCount: {
				const ownContentContainer = ctx.layers.getLayerOwnContentContainer(layer.id);
				ownContentContainer.removeChildren();

				createLayerInstances(
					actionState,
					layer,
					layerPropertyMap,
					ctx.properties.getPropertyValue,
					ownContentContainer,
					ctx.graphics.getLayerGraphic(actionState, layer),
				);
				break;
			}
			case Performable.UpdateArrayModifierTransform: {
				const ownContentContainer = ctx.layers.getLayerOwnContentContainer(layer.id);

				updateLayerInstanceTransforms(
					actionState,
					layer,
					layerPropertyMap,
					ctx.properties.getPropertyValue,
					ownContentContainer,
				);
				break;
			}
		}
	}
};
