import React, { useContext, useRef } from "react";
import { AreaIdContext } from "~/area/util/AreaIdContext";
import { PickWhipIcon } from "~/components/icons/PickWhipIcon";
import { CompositionLayer } from "~/composition/compositionTypes";
import { getValidLayerParentLayerIds } from "~/composition/layer/layerUtils";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import {
	SelectOneContextMenu,
	SelectOneContextMenuProps,
} from "~/contextMenu/selectOne/SelectOneContextMenu";
import { cssVariables } from "~/cssVariables";
import { useRefRect } from "~/hook/useRefRect";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { createOperation } from "~/state/operation";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { layerHandlers } from "~/timeline/layer/layerHandlers";
import { layerOperations } from "~/timeline/layer/layerOperations";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	wrapper: css`
		width: 116px;
		margin-right: 4px;
		height: 16px;
		position: relative;
		display: flex;
	`,

	select: css`
		height: 14px;
		background: ${cssVariables.dark500};
		color: ${cssVariables.light500};
		font: 400 11px/14px ${cssVariables.fontFamily};
		border: none;
		display: block;
		margin-top: 1px;
		text-align: left;
		padding: 0 6px;
		border-radius: 4px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow-x: hidden;
		width: 98px;
		margin-right: 2px;
	`,

	pickWhipWrapper: css`
		width: 16px;
		height: 16px;

		svg {
			width: 16px;
			height: 16px;
			stroke: ${cssVariables.light300};
		}
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

const TimelineLayerParentComponent: React.FC<Props> = (props) => {
	const ref = useRef<HTMLDivElement>(null);
	const rect = useRefRect(ref)!;

	const onRemoveParent = (params: RequestActionParams) => {
		const op = createOperation();
		layerOperations.removeLayerParentLayer(op, props.layerId);
		params.dispatch(op.actions);
		params.submitAction("Remove layer's parent layer");
	};

	const onSelectParent = (params: RequestActionParams, parentId: string) => {
		const op = createOperation();
		layerOperations.setLayerParentLayer(op, props.layerId, parentId);
		params.dispatch(op.actions);
		params.submitAction("Set layer's parent layer");
	};

	const openContextMenu = () => {
		requestAction(
			{
				history: true,
				beforeSubmit: (params) => params.dispatch(contextMenuActions.closeContextMenu()),
			},
			(params) => {
				const { compositionState } = getActionState();

				const position = Vec2.new(rect.left, rect.top + rect.height);

				const layerIds = getValidLayerParentLayerIds(props.layerId, compositionState);

				const options = [
					...layerIds.map((layerId) => {
						const layer = compositionState.layers[layerId];
						return {
							item: layer.id,
							label: layer.name,
							selected: layer.id === props.parentLayerId,
						};
					}),
					{
						item: "",
						label: "None",
						selected: !props.parentLayerId,
					},
				];

				params.dispatch(
					contextMenuActions.openCustomContextMenu<SelectOneContextMenuProps<string>>({
						close: params.cancelAction,
						component: SelectOneContextMenu,
						position,
						props: {
							options: options,
							onSelect: (parentId) => {
								if (!parentId) {
									onRemoveParent(params);
									return;
								}
								onSelectParent(params, parentId);
							},
						},
						alignPosition: "bottom-left",
						closeMenuBuffer: 64,
					}),
				);
			},
		);
	};

	const areaId = useContext(AreaIdContext);

	const onPickWhipMouseDown = (e: React.MouseEvent) => {
		layerHandlers.onLayerParentWhipMouseDown(e, areaId, props.layerId);
	};

	return (
		<div className={s("wrapper")} ref={ref}>
			<div
				className={s("select")}
				onMouseDown={separateLeftRightMouse({
					left: openContextMenu,
				})}
			>
				{props.parentLayerName}
			</div>
			<div
				className={s("pickWhipWrapper")}
				onMouseDown={separateLeftRightMouse({
					left: onPickWhipMouseDown,
				})}
			>
				<PickWhipIcon />
			</div>
		</div>
	);
};

const mapState: MapActionState<StateProps, OwnProps> = ({ compositionState }, { layerId }) => {
	const layer = compositionState.layers[layerId];

	const parentLayer: CompositionLayer | undefined = compositionState.layers[layer.parentLayerId];

	return {
		parentLayerId: layer.parentLayerId,
		parentLayerName: parentLayer?.name ?? "None",
	};
};

export const TimelineLayerParent = connectActionState(mapState)(TimelineLayerParentComponent);
