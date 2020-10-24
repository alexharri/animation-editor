import { getLayerArrayModifierIndexTransform } from "~/composition/indexTransforms";
import {
	getLayerNameToProperty,
	getLayerRectDimensionsAndOffset,
} from "~/composition/layer/layerUtils";
import { applyParentTransform, getLayerBaseTransform } from "~/composition/transformUtils";
import { getLayerArrayModifiers } from "~/composition/util/compositionPropertyUtils";
import { layerParentSort } from "~/shared/layer/layerParentSort";
import { ArrayModifierPropertyValueMap, LayerTransform, PropertyValueMap } from "~/types";
import { Mat2 } from "~/util/math/mat";

interface LayerTransformMap {
	[layerId: string]: {
		transform: LayerTransform;
		indexTransforms: Array<{
			[index: number]: LayerTransform;
		}>;
	};
}

const defaultTransform: LayerTransform = {
	anchor: Vec2.new(0, 0),
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
	translate: Vec2.new(0, 0),
	matrix: Mat2.identity(),
};

export const computeLayerTransformMap = (
	compositionId: string,
	propertyToValue: PropertyValueMap,
	arrayModifierPropertyToValue: ArrayModifierPropertyValueMap,
	state: Pick<ActionState, "compositionState" | "shapeState" | "shapeSelectionState">,
	parentTransform: LayerTransform = defaultTransform,
	options: { recursive: boolean },
): LayerTransformMap => {
	const map: LayerTransformMap = {};
	const { compositionState } = state;

	const composition = compositionState.compositions[compositionId];

	const layerIds = layerParentSort(composition.layers, compositionState);

	for (const layerId of layerIds) {
		const layer = compositionState.layers[layerId];
		const nameToProperty = getLayerNameToProperty(propertyToValue, compositionState, layerId);
		const [width, height] = getLayerRectDimensionsAndOffset(layer, nameToProperty, state);

		map[layer.id] = {
			transform: defaultTransform,
			indexTransforms: [],
		};

		const arrMods = getLayerArrayModifiers(layerId, compositionState);

		let count = 1;

		if (options.recursive) {
			for (const arrMod of arrMods) {
				const { countId } = arrMod;
				const countValue = propertyToValue[countId].computedValue;
				count *= Math.max(1, countValue);
			}
		}

		for (let i = 0; i < count; i++) {
			let transform = getLayerBaseTransform(layerId, propertyToValue, compositionState);
			getLayerBaseTransform;
			if (layer.parentLayerId) {
				const parentTransform = map[layer.parentLayerId].transform;
				transform = applyParentTransform(transform, parentTransform, false);
			} else {
				transform = applyParentTransform(transform, parentTransform, true);
			}

			map[layer.id].transform = transform;
		}

		if (options.recursive) {
			for (const arrMod of arrMods) {
				const {
					countId,
					rotationCorrectionId,
					transformGroupId,
					transformBehaviorId,
				} = arrMod;

				const count = Math.max(1, propertyToValue[countId].computedValue);
				const rotationCorrection = propertyToValue[rotationCorrectionId].computedValue;
				const transformBehavior = propertyToValue[transformBehaviorId].computedValue;

				const indexTransform = getLayerArrayModifierIndexTransform(
					compositionState,
					propertyToValue,
					arrayModifierPropertyToValue,
					count,
					[width, height],
					rotationCorrection,
					parentTransform,
					transformGroupId,
					transformBehavior,
				);
				map[layer.id].indexTransforms.push(indexTransform);
			}
		}
	}

	return map;
};
