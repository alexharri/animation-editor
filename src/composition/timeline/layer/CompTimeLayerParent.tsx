import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { compositionActions } from "~/composition/state/compositionReducer";
import {
	computeLayerTransformMap,
	getLayerTransformProperties,
} from "~/composition/workspace/transform/transformUtils";
import { RAD_TO_DEG_FAC } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { computeCompPropertyValues } from "~/shared/property/computeCompositionPropertyValues";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { rotateVec2CCW } from "~/util/math";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	wrapper: css`
		width: 98px;
		margin-right: 4px;
		height: 16px;
		position: relative;
	`,

	name: css`
		font-size: 11px;
		color: #bbb;
		line-height: 16px;
		padding: 0 3px;
		border-radius: 3px;
		cursor: default;
		overflow-x: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow-y: hidden;
	`,
}));

interface OwnProps {
	layerId: string;
}
interface StateProps {
	parentLayerId: string;
	parentLayerName: string;
}
type Props = OwnProps & StateProps;

const CompTimeLayerParentComponent: React.FC<Props> = (props) => {
	const onRemoveParent = (params: RequestActionParams) => {
		const actionState = getActionState();
		const { compositionState } = actionState;
		const layer = compositionState.layers[props.layerId];

		const propertyToValue = computeCompPropertyValues(actionState, layer.compositionId);
		const transformMap = computeLayerTransformMap(
			layer.compositionId,
			propertyToValue,
			compositionState,
		);

		const transform = transformMap[layer.id];

		params.dispatch(compositionActions.setLayerParentLayerId(props.layerId, ""));

		const properties = getLayerTransformProperties(props.layerId, compositionState);
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

		params.dispatch(contextMenuActions.closeContextMenu());
		params.submitAction("Set layer parent layer");
	};

	const onSelectParent = (params: RequestActionParams, parentId: string) => {
		const actionState = getActionState();
		const { compositionState } = actionState;
		const layer = compositionState.layers[props.layerId];

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

		const properties = getLayerTransformProperties(props.layerId, compositionState);
		params.dispatch(
			compositionActions.setPropertyValue(properties.anchorX.id, anchor.x),
			compositionActions.setPropertyValue(properties.anchorY.id, anchor.y),
			compositionActions.setPropertyValue(properties.positionX.id, translate.x),
			compositionActions.setPropertyValue(properties.positionY.id, translate.y),
			compositionActions.setPropertyValue(properties.rotation.id, rotation * RAD_TO_DEG_FAC),
			compositionActions.setPropertyValue(properties.scale.id, scale),
		);

		params.dispatch(compositionActions.setLayerParentLayerId(props.layerId, parentId));
		params.dispatch(contextMenuActions.closeContextMenu());
		params.submitAction("Set layer parent layer");
	};

	return (
		<div className={s("wrapper")}>
			<div
				className={s("name")}
				onMouseDown={separateLeftRightMouse({
					left: (e) => {
						requestAction({ history: true }, (params) => {
							const { compositionState } = getActionState();

							const layer = compositionState.layers[props.layerId];
							const composition = compositionState.compositions[layer.compositionId];
							const layerIds = composition.layers.filter((id) => id !== layer.id);

							params.dispatch(
								contextMenuActions.openContextMenu(
									"Parent",
									[
										{
											label: "None",
											onSelect: () => onRemoveParent(params),
										},
										...layerIds.map((layerId) => {
											const layer = compositionState.layers[layerId];
											return {
												label: layer.name,
												onSelect: () => onSelectParent(params, layerId),
											};
										}),
									],
									Vec2.fromEvent(e),
									params.cancelAction,
								),
							);
						});
					},
				})}
			>
				{props.parentLayerName}
			</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositionState }, { layerId }) => {
	const layer = compositionState.layers[layerId];

	const parentLayer: CompositionLayer | undefined = compositionState.layers[layer.parentLayerId];

	return {
		parentLayerId: layer.parentLayerId,
		parentLayerName: parentLayer?.name ?? "Not selected",
	};
};

export const CompTimeLayerParent = connectActionState(mapState)(CompTimeLayerParentComponent);
