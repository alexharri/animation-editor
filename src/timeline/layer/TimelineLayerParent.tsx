import React, { useRef } from "react";
import { CompositionLayer } from "~/composition/compositionTypes";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import {
	SelectOneContextMenu,
	SelectOneContextMenuProps,
} from "~/contextMenu/selectOne/SelectOneContextMenu";
import { cssVariables } from "~/cssVariables";
import { useRefRect } from "~/hook/useRefRect";
import { requestAction, RequestActionParams } from "~/listener/requestAction";
import { connectActionState, getActionState } from "~/state/stateUtils";
import { timelineLayerParentHandlers } from "~/timeline/layer/timelineLayerParentHandlers";
import { separateLeftRightMouse } from "~/util/mouse";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(({ css }) => ({
	wrapper: css`
		width: 98px;
		margin-right: 4px;
		height: 16px;
		position: relative;
	`,

	select: css`
		height: 14px;
		background: ${cssVariables.dark500};
		color: ${cssVariables.light500};
		font: 400 11px/14px ${cssVariables.fontFamily};
		border: none;
		display: block;
		width: 98px;
		margin: 1px 0 0;
		text-align: left;
		padding: 0 6px;
		border-radius: 4px;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow-x: hidden;
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
		params.cancelAction(); // Close modal and open requestAction for the handler.
		timelineLayerParentHandlers.onRemoveParent(props.layerId);
	};

	const onSelectParent = (params: RequestActionParams, parentId: string) => {
		params.cancelAction(); // Close modal and open requestAction for the handler.
		timelineLayerParentHandlers.onSelectParent(props.layerId, parentId);
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

				const layer = compositionState.layers[props.layerId];
				const composition = compositionState.compositions[layer.compositionId];
				const layerIds = composition.layers.filter((id) => id !== layer.id);

				const isReferencedBy = (layerId: string): boolean => {
					const layer = compositionState.layers[layerId];
					if (!layer.parentLayerId) {
						return false;
					}
					if (layer.parentLayerId === props.layerId) {
						return true;
					}
					return isReferencedBy(layer.parentLayerId);
				};

				const options = [
					...layerIds
						// Filter out potential circular references
						.filter((layerId) => !isReferencedBy(layerId))
						.map((layerId) => {
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

export const TimelineLayerParent = connectActionState(mapState)(TimelineLayerParentComponent);
