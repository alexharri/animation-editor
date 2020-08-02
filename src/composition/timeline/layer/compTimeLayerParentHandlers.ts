import { compositionActions } from "~/composition/state/compositionReducer";
import {
	adjustTransformToParent,
	computeLayerTransformMap,
	getLayerTransformProperties,
} from "~/composition/transformUtils";
import { RAD_TO_DEG_FAC } from "~/constants";
import { requestAction } from "~/listener/requestAction";
import { computeCompositionPropertyValues } from "~/shared/property/computeCompositionPropertyValues";
import { getActionState } from "~/state/stateUtils";

const getTransformMap = (compositionId: string) => {
	const actionState = getActionState();
	const { compositionState } = actionState;

	const { frameIndex, width, height } = compositionState.compositions[compositionId];

	const map = computeCompositionPropertyValues(
		actionState,
		compositionId,
		frameIndex,
		{ width, height },
		{ recursive: false },
	);
	const transformMap = computeLayerTransformMap(compositionId, map.properties, compositionState);
	return transformMap;
};

export const compTimeLayerParentHandlers = {
	onSelectParent: (layerId: string, parentId: string) => {
		requestAction({ history: true }, (params) => {
			const { compositionState } = getActionState();
			const layer = compositionState.layers[layerId];

			const transformMap = getTransformMap(layer.compositionId);

			const transform = transformMap[layer.id];
			const parentTransform = transformMap[parentId];

			const { anchor, scale, rotation, translate } = adjustTransformToParent(
				transform,
				parentTransform,
			);

			const properties = getLayerTransformProperties(layerId, compositionState);

			params.dispatch(
				compositionActions.setPropertyValue(properties.anchorX.id, anchor.x),
				compositionActions.setPropertyValue(properties.anchorY.id, anchor.y),
				compositionActions.setPropertyValue(properties.positionX.id, translate.x),
				compositionActions.setPropertyValue(properties.positionY.id, translate.y),
				compositionActions.setPropertyValue(
					properties.rotation.id,
					rotation * RAD_TO_DEG_FAC,
				),
				compositionActions.setPropertyValue(properties.scale.id, scale),
				compositionActions.setLayerParentLayerId(layerId, parentId),
			);

			params.submitAction("Set layer parent layer");
		});
	},

	onRemoveParent: (layerId: string) => {
		requestAction({ history: true }, (params) => {
			const { compositionState } = getActionState();
			const layer = compositionState.layers[layerId];

			const transformMap = getTransformMap(layer.compositionId);
			const { anchor, translate, rotation, scale } = transformMap[layer.id];

			const properties = getLayerTransformProperties(layerId, compositionState);

			params.dispatch(
				compositionActions.setPropertyValue(properties.anchorX.id, anchor.x),
				compositionActions.setPropertyValue(properties.anchorY.id, anchor.y),
				compositionActions.setPropertyValue(properties.positionX.id, translate.x),
				compositionActions.setPropertyValue(properties.positionY.id, translate.y),
				compositionActions.setPropertyValue(
					properties.rotation.id,
					rotation * RAD_TO_DEG_FAC,
				),
				compositionActions.setPropertyValue(properties.scale.id, scale),
				compositionActions.setLayerParentLayerId(layerId, ""),
			);

			params.submitAction("Set layer parent layer");
		});
	},
};
