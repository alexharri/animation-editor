import { CompositionContext } from "~/composition/manager/compositionContext";
import { Performable } from "~/composition/manager/performableManager";
import { DEG_TO_RAD_FAC } from "~/constants";
import { updatePixiLayerContent } from "~/render/pixi/layerToPixi";
import { PropertyName, TransformPropertyName } from "~/types";

export const executePerformables = (
	ctx: CompositionContext,
	actionState: ActionState,
	layerId: string,
	performables: Performable[],
) => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];

	const map = ctx.layers.getLayerPropertyMap(layerId);

	const getPropertyValue = (name: TransformPropertyName): any => {
		return ctx.properties.getPropertyValue(map[name]);
	};

	for (const performable of performables) {
		switch (performable) {
			case Performable.DrawLayer: {
				updatePixiLayerContent(
					actionState,
					layer,
					ctx.layers.getLayerOwnContentContainer(layerId),
					ctx.properties.getPropertyValue,
				);
				break;
			}
			case Performable.UpdatePosition: {
				const container = ctx.layers.getLayerTransformContainer(layerId);
				const x = getPropertyValue(PropertyName.PositionX);
				const y = getPropertyValue(PropertyName.PositionY);
				container.position.set(x, y);
				break;
			}
			case Performable.UpdateTransform: {
				const container = ctx.layers.getLayerTransformContainer(layerId);

				const xPos = getPropertyValue(PropertyName.PositionX);
				const yPos = getPropertyValue(PropertyName.PositionY);
				const xAnchor = getPropertyValue(PropertyName.AnchorX);
				const yAnchor = getPropertyValue(PropertyName.AnchorY);
				const xScale = getPropertyValue(PropertyName.ScaleX);
				const yScale = getPropertyValue(PropertyName.ScaleY);
				const rotation = getPropertyValue(PropertyName.Rotation);

				container.position.set(xPos, yPos);
				container.scale.set(xScale, yScale);
				container.pivot.set(xAnchor, yAnchor);
				container.rotation = rotation * DEG_TO_RAD_FAC;
				break;
			}
		}
	}
};
