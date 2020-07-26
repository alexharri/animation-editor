import React from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { compTimeLayerParentHandlers } from "~/composition/timeline/layer/compTimeLayerParentHandlers";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { connectActionState, getActionState } from "~/state/stateUtils";
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
		params.cancelAction(); // Close modal and open requestAction for the handler.
		compTimeLayerParentHandlers.onRemoveParent(props.layerId);
	};

	const onSelectParent = (params: RequestActionParams, parentId: string) => {
		params.cancelAction(); // Close modal and open requestAction for the handler.
		compTimeLayerParentHandlers.onSelectParent(props.layerId, parentId);
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
