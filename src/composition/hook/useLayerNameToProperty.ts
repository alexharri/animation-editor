import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { useActionState } from "~/hook/useActionState";
import { CompositionRenderValues, PropertyName } from "~/types";

export const useLayerNameToProperty = (
	map: CompositionRenderValues,
	_compositionId: string,
	layerId: string,
) => {
	return useActionState((state) => {
		const properties = getLayerCompositionProperties(layerId, state.compositionState);
		const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
			(obj, p) => {
				const value = map.properties[p.id];
				(obj as any)[PropertyName[p.name]] = value.computedValue;
				return obj;
			},
			{} as any,
		);

		const { scale, rotation, translate, anchor } = map.transforms[layerId];

		return {
			...nameToProperty,
			Scale: scale,
			Rotation: rotation,
			PositionX: translate.x,
			PositionY: translate.y,
			AnchorX: anchor.x,
			AnchorY: anchor.y,
		};
	});
};
