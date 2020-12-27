import { layerUtils } from "~/composition/layer/layerUtils";
import { CompositionContext } from "~/composition/manager/compositionContext";
import { Performable } from "~/composition/manager/performableManager";
import { DEG_TO_RAD_FAC } from "~/constants";
import { updatePixiLayerContent } from "~/render/pixi/layerToPixi";

export const executePerformables = (
	ctx: CompositionContext,
	actionState: ActionState,
	layerId: string,
	performables: Performable[],
) => {
	const { compositionState } = actionState;
	const layer = compositionState.layers[layerId];

	for (const performable of performables) {
		switch (performable) {
			case Performable.DrawLayer: {
				updatePixiLayerContent(actionState, layer, ctx.layers.getLayerContainer(layerId));
				break;
			}
			case Performable.UpdatePosition: {
				const container = ctx.layers.getLayerContainer(layerId);
				const position = layerUtils.getPosition(layerId);
				container.position.set(position.x, position.y);
				break;
			}
			case Performable.UpdateTransform: {
				const container = ctx.layers.getLayerContainer(layerId);
				const transform = layerUtils.getTransform(layerId);
				const { translate, anchor, scaleX, scaleY, rotation } = transform;
				container.position.set(translate.x, translate.y);
				container.scale.set(scaleX, scaleY);
				container.pivot.set(anchor.x, anchor.y);
				container.rotation = rotation * DEG_TO_RAD_FAC;
				break;
			}
		}
	}
};
