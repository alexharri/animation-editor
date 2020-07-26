import { compositionActions } from "~/composition/state/compositionReducer";
import {
	computeLayerTransformMap,
	getLayerTransformProperties,
} from "~/composition/transformUtils";
import { RAD_TO_DEG_FAC } from "~/constants";
import { requestAction } from "~/listener/requestAction";
import { computeCompPropertyValues } from "~/shared/property/computeCompositionPropertyValues";
import { getActionState } from "~/state/stateUtils";
import { rotateVec2CCW } from "~/util/math";

export const compTimeLayerParentHandlers = {
	onSelectParent: (layerId: string, parentId: string) => {
		requestAction({ history: true }, (params) => {
			const actionState = getActionState();
			const { compositionState } = actionState;
			const layer = compositionState.layers[layerId];

			const propertyToValue = computeCompPropertyValues(actionState, layer.compositionId);
			const transformMap = computeLayerTransformMap(
				layer.compositionId,
				propertyToValue,
				compositionState,
			);

			const transform = transformMap[layer.id];
			const parentTransform = transformMap[parentId];

			const rotation = transform.rotation - parentTransform.rotation;
			const scale = transform.scale / parentTransform.scale;
			const translate = rotateVec2CCW(
				transform.translate.sub(parentTransform.translate),
				-parentTransform.rotation,
				parentTransform.anchor,
			).scale(1 / parentTransform.scale, parentTransform.anchor);
			const anchor = transform.anchor;

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
			);

			params.dispatch(compositionActions.setLayerParentLayerId(layerId, parentId));

			params.submitAction("Set layer parent layer");
		});
	},

	onRemoveParent: (layerId: string) => {
		requestAction({ history: true }, (params) => {
			const actionState = getActionState();
			const { compositionState } = actionState;
			const layer = compositionState.layers[layerId];

			const propertyToValue = computeCompPropertyValues(actionState, layer.compositionId);
			const transformMap = computeLayerTransformMap(
				layer.compositionId,
				propertyToValue,
				compositionState,
			);

			const transform = transformMap[layer.id];

			params.dispatch(compositionActions.setLayerParentLayerId(layerId, ""));

			const properties = getLayerTransformProperties(layerId, compositionState);
			params.dispatch(
				compositionActions.setPropertyValue(properties.anchorX.id, transform.anchor.x),
				compositionActions.setPropertyValue(properties.anchorY.id, transform.anchor.y),
				compositionActions.setPropertyValue(properties.positionX.id, transform.translate.x),
				compositionActions.setPropertyValue(properties.positionY.id, transform.translate.y),
				compositionActions.setPropertyValue(
					properties.rotation.id,
					transform.rotation * RAD_TO_DEG_FAC,
				),
				compositionActions.setPropertyValue(properties.scale.id, transform.scale),
			);

			params.submitAction("Set layer parent layer");
		});
	},
};
