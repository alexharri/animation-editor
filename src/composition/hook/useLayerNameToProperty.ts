import { getLayerCompositionProperties } from "~/composition/util/compositionPropertyUtils";
import { useActionState } from "~/hook/useActionState";
import { CompositionRenderValues, PropertyName } from "~/types";

export const useLayerNameToProperty = (
	map: CompositionRenderValues,
	_compositionId: string,
	layerId: string,
	index: number,
) => {
	return useActionState((state) => {
		const properties = getLayerCompositionProperties(layerId, state.compositionState);

		const nameToProperty = properties.reduce<{ [key in keyof typeof PropertyName]: any }>(
			(obj, p) => {
				const value = map.properties[p.id];
				(obj as any)[PropertyName[p.name]] =
					value.computedValue[index] ?? value.computedValue[0];
				return obj;
			},
			{} as any,
		);

		return nameToProperty;
	});
};
