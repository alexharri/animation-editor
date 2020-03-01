import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { handleAreaDragFromCorner } from "~/area/handlers/areaDragFromCorner";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import styles from "~/area/components/Area.styles";
import { AreaWindowProps } from "~/types/areaTypes";
import { areaComponentRegistry } from "~/area/windows";

const s = compileStylesheetLabelled(styles);

interface OwnProps {
	id: string;
	viewport: Rect;
}
interface StateProps {
	state: any;
	raised: boolean;
	Component: React.ComponentType<AreaWindowProps<any>>;
}
type Props = StateProps & OwnProps;

const AreaComponent: React.FC<Props> = props => {
	const { id, raised, viewport, Component } = props;

	return (
		<div data-areaid={id} className={s("area", { raised })} style={viewport}>
			{["ne", "nw", "se", "sw"].map(dir => (
				<div
					key={dir}
					className={s("area__corner", { [dir]: true })}
					onMouseDown={e => handleAreaDragFromCorner(e, dir as "ne", id, viewport)}
				/>
			))}
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
		state: areas[id].state,
		raised: !!(isEligibleForJoin || isBeingJoined),
		Component: component,
	};
};

export const Area = connectActionState(mapStateToProps)(AreaComponent);
