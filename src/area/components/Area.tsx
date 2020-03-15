import React, { useState } from "react";
import { connectActionState } from "~/state/stateUtils";
import { handleAreaDragFromCorner } from "~/area/handlers/areaDragFromCorner";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/area/components/Area.styles";
import { AreaWindowProps } from "~/types/areaTypes";
import { areaComponentRegistry } from "~/area/windows";
import { AreaType } from "~/constants";
import { EditIcon } from "~/components/icons/EditIcon";
import { PenIcon } from "~/components/icons/PenIcon";
import { requestAction } from "~/listener/requestAction";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { areaActions } from "~/area/state/areaActions";
import { store } from "~/state/store";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	id: string;
	viewport: Rect;
}
interface StateProps {
	state: any;
	type: AreaType;
	raised: boolean;
	Component: React.ComponentType<AreaWindowProps<any>>;
}
type Props = StateProps & OwnProps;

const areaTypeOptions: Array<{ icon: React.ComponentType; type: AreaType; label: string }> = [
	{
		icon: PenIcon,
		type: AreaType.VectorEditor,
		label: "Vector Editor",
	},
	{
		icon: EditIcon,
		type: AreaType.NodeEditor,
		label: "Node Editor",
	},
];

const typeToIndex = areaTypeOptions.reduce<{ [key: string]: number }>((obj, { type }, i) => {
	obj[type] = i;
	return obj;
}, {});

const AreaComponent: React.FC<Props> = props => {
	const { id, raised, viewport, Component, type } = props;

	const { icon: Icon } = areaTypeOptions[typeToIndex[type]];

	const openSelectArea = (_: React.MouseEvent) => {
		const pos = Vec2.new(viewport.left + 4, viewport.top + 4);
		requestAction({}, ({ cancelAction, dispatch, submitAction }) => {
			dispatch(
				contextMenuActions.openContextMenu(
					"Area type",
					[
						{
							icon: EditIcon,
							label: "Vector Editor",
							onSelect: () => {
								console.log(id, AreaType.VectorEditor);
								dispatch(areaActions.setAreaType(id, AreaType.VectorEditor));
								dispatch(contextMenuActions.closeContextMenu());
								submitAction("Update area type");
							},
						},
						{
							label: "Node Editor",
							onSelect: () => {
								console.log(id, AreaType.NodeEditor);
								dispatch(areaActions.setAreaType(id, AreaType.NodeEditor));
								dispatch(contextMenuActions.closeContextMenu());
								submitAction("Update area type");
							},
						},
					],
					pos,
					cancelAction,
				),
			);
		});
	};

	return (
		<div data-areaid={id} className={s("area", { raised })} style={viewport}>
			{["ne", "nw", "se", "sw"].map(dir => (
				<div
					key={dir}
					className={s("area__corner", { [dir]: true })}
					onMouseDown={e => handleAreaDragFromCorner(e, dir as "ne", id, viewport)}
				/>
			))}
			<button className={s("selectAreaButton")} onMouseDown={openSelectArea}>
				<Icon />
			</button>
			<div className={s("area__content")}>
				<Component areaId={props.id} viewport={viewport} areaState={props.state} />
			</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ area: { joinPreview, areas } },
	{ id },
) => {
	const isEligibleForJoin = joinPreview && joinPreview.eligibleAreaIds.indexOf(id) !== -1;
	const isBeingJoined = joinPreview && joinPreview.areaId === id;

	const component = areaComponentRegistry[areas[id].type];

	return {
		type: areas[id].type,
		state: areas[id].state,
		raised: !!(isEligibleForJoin || isBeingJoined),
		Component: component,
	};
};

export const Area = connectActionState(mapStateToProps)(AreaComponent);
