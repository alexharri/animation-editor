import React from "react";
import { areaComponentRegistry, _areaReactKeyRegistry } from "~/area/areaRegistry";
import styles from "~/area/components/Area.styles";
import { AreaErrorBoundary } from "~/area/components/AreaErrorBoundary";
import { useAreaKeyboardShortcuts } from "~/area/components/useAreaKeyboardShortcuts";
import { handleAreaDragFromCorner } from "~/area/handlers/areaDragFromCorner";
import { areaActions } from "~/area/state/areaActions";
import { AreaIdContext } from "~/area/util/AreaIdContext";
import { EditIcon } from "~/components/icons/EditIcon";
import { PenIcon } from "~/components/icons/PenIcon";
import { AreaType, AREA_BORDER_WIDTH } from "~/constants";
import { contextMenuActions } from "~/contextMenu/contextMenuActions";
import { requestAction } from "~/listener/requestAction";
import { connectActionState } from "~/state/stateUtils";
import { AreaComponentProps } from "~/types/areaTypes";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	id: string;
	viewport: Rect;
}
interface StateProps {
	state: any;
	type: AreaType;
	raised: boolean;
	Component: React.ComponentType<AreaComponentProps<any>>;
}
type Props = StateProps & OwnProps;

const areaTypeOptions: Array<{ icon: React.ComponentType; type: AreaType; label: string }> = [
	{
		icon: PenIcon,
		type: AreaType.Project,
		label: "Project",
	},
	{
		icon: PenIcon,
		type: AreaType.Timeline,
		label: "Timeline",
	},
	{
		icon: PenIcon,
		type: AreaType.Workspace,
		label: "Workspace",
	},
	{
		icon: EditIcon,
		type: AreaType.FlowEditor,
		label: "Node Editor",
	},
	{
		icon: EditIcon,
		type: AreaType.History,
		label: "History",
	},
];

const typeToIndex = areaTypeOptions.reduce<{ [key: string]: number }>((obj, { type }, i) => {
	obj[type] = i;
	return obj;
}, {});

export const AreaComponent: React.FC<Props> = (props) => {
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
							label: "Project",
							type: AreaType.Project,
						},
						{
							label: "Timeline",
							type: AreaType.Timeline,
						},
						{
							label: "Workspace",
							type: AreaType.Workspace,
						},
						{
							label: "Node Editor",
							type: AreaType.FlowEditor,
						},
						{
							label: "History",
							type: AreaType.History,
						},
					].map((item) => ({
						// icon: item.icon,
						label: item.label,
						onSelect: () => {
							dispatch(areaActions.setAreaType(id, item.type));
							dispatch(contextMenuActions.closeContextMenu());
							submitAction("Update area type");
						},
					})),
					pos,
					cancelAction,
				),
			);
		});
	};

	const areaStateKey = _areaReactKeyRegistry[props.type];
	const key = areaStateKey ? props.state[areaStateKey] : props.id;

	useAreaKeyboardShortcuts(id, type, viewport);

	return (
		<div data-areaid={id} className={s("area", { raised })} style={viewport}>
			{["ne", "nw", "se", "sw"].map((dir) => (
				<div
					key={dir}
					className={s("area__corner", { [dir]: true })}
					onMouseDown={(e) => handleAreaDragFromCorner(e, dir as "ne", id, viewport)}
				/>
			))}
			<button className={s("selectAreaButton")} onMouseDown={openSelectArea}>
				<Icon />
			</button>
			<div className={s("area__content")}>
				<AreaIdContext.Provider value={props.id}>
					<AreaErrorBoundary
						key={key}
						component={Component}
						areaId={props.id}
						areaState={props.state}
						left={viewport.left + AREA_BORDER_WIDTH}
						top={viewport.top + AREA_BORDER_WIDTH}
						width={viewport.width - AREA_BORDER_WIDTH * 2}
						height={viewport.height - AREA_BORDER_WIDTH * 2}
					/>
				</AreaIdContext.Provider>
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

	const component = areaComponentRegistry[areas[id].type] as React.ComponentType<
		AreaComponentProps<any>
	>;

	return {
		type: areas[id].type,
		state: areas[id].state,
		raised: !!(isEligibleForJoin || isBeingJoined),
		Component: component,
	};
};

export const Area = connectActionState(mapStateToProps)(AreaComponent);
