import { useContext } from "react";
import { computeLayerTransformMap } from "~/composition/transformUtils";
import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { useActionState } from "~/hook/useActionState";
import { CompositionPropertyValuesContext } from "~/shared/property/computeCompositionPropertyValues";
import { PropertyName } from "~/types";

export const useLayerNameToProperty = (compositionId: string, layerId: string) => {
	const propertyToValue = useContext(CompositionPropertyValuesContext);

	return useActionState((state) => {
		const properties = getLayerCompositionProperties(layerId, state.compositionState);
		const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
			(obj, p) => {
				const value = propertyToValue[p.id];
				(obj as any)[PropertyName[p.name]] = value.computedValue;
				return obj;
			},
			{} as any,
		);

		const transformMap = computeLayerTransformMap(
			compositionId,
			propertyToValue,
			state.compositionState,
		);

		if (!transformMap[layerId]) {
			return nameToProperty;
		}

		const { scale, rotation, translate, anchor } = transformMap[layerId];

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
