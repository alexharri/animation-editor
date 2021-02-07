import * as PIXI from "pixi.js";
import { CompositionManager } from "~/composition/manager/compositionManager";
import { getTransformFromTransformGroupId } from "~/composition/transformUtils";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import { DEG_TO_RAD_FAC } from "~/constants";
import { createArrayModifierPIXITransforms } from "~/render/pixi/pixiTransform";
import { Performable, PropertyName, TransformPropertyName } from "~/types";

export const executePerformables = (
	ctx: CompositionManager,
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
				ctx.graphics.updateLayerGraphic(actionState, layer);
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
			case Performable.UpdateArrayModifierCount: {
				const { compositionState } = actionState;
				const arrayModifiers = getLayerArrayModifiers(layer.id, compositionState);

				const resolvedModifiers = arrayModifiers.map((modifier) => {
					const transform = getTransformFromTransformGroupId(
						modifier.transformGroupId,
						compositionState,
						ctx.properties.getPropertyValue,
					);
					return {
						count: ctx.properties.getPropertyValue(modifier.countId),
						transform,
					};
				});

				const dimensions = resolvedModifiers.map((item) => item.count);
				const transforms = resolvedModifiers.map((item) => item.transform);

				const pixiTransforms = createArrayModifierPIXITransforms(dimensions, transforms);
				const ownContentContainer = ctx.layers.getLayerOwnContentContainer(layer.id);
				ownContentContainer.removeChildren();

				for (let i = 0; i < pixiTransforms.length; i++) {
					const graphic = ctx.graphics.getLayerGraphic(actionState, layer);
					const g0 = new PIXI.Graphics(graphic.geometry);
					g0.localTransform.append(pixiTransforms[i].worldTransform);
					ownContentContainer.addChild(g0);
				}
				break;
			}
			case Performable.UpdateArrayModifierTransform: {
				const { compositionState } = actionState;
				const arrayModifiers = getLayerArrayModifiers(layer.id, compositionState);

				const resolvedModifiers = arrayModifiers.map((modifier) => {
					const transform = getTransformFromTransformGroupId(
						modifier.transformGroupId,
						compositionState,
						ctx.properties.getPropertyValue,
					);
					return {
						count: ctx.properties.getPropertyValue(modifier.countId),
						transform,
					};
				});

				const dimensions = resolvedModifiers.map((item) => item.count);
				const transforms = resolvedModifiers.map((item) => item.transform);

				const pixiTransforms = createArrayModifierPIXITransforms(dimensions, transforms);
				const ownContentContainer = ctx.layers.getLayerOwnContentContainer(layer.id);
				const children = ownContentContainer.children;

				for (let i = 0; i < children.length; i++) {
					const child = children[i];
					child.transform.setFromMatrix(pixiTransforms[i].worldTransform);
				}
				break;
			}
		}
	}
};
