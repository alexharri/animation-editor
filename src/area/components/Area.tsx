import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { handleAreaDragFromCorner } from "~/area/handlers/areaDragFromCorner";
import { compileStylesheet } from "~/util/stylesheets";
import styles from "~/area/components/Area.styles";

const s = compileStylesheet(styles);

interface OwnProps {
	id: string;
	viewport: Rect;
}
interface StateProps {
	raised: boolean;
}
type Props = StateProps & OwnProps;

const AreaComponent: React.FC<Props> = props => {
	const { id, raised, viewport } = props;

	return (
		<div data-areaid={id} className={s("area", { raised })} style={viewport}>
			{["ne", "nw", "se", "sw"].map(dir => (
				<div
					key={dir}
					className={s("area__corner", { [dir]: true })}
					onMouseDown={e => handleAreaDragFromCorner(e, dir as "ne", id, viewport)}
				/>
			))}
			<div className={s("area__content")}>test</div>
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps, OwnProps> = (
	{ area: { joinPreview } },
	{ id },
) => {
	const isEligibleForJoin = joinPreview && joinPreview.eligibleAreaIds.indexOf(id) !== -1;
	const isBeingJoined = joinPreview && joinPreview.areaId === id;

	return {
		raised: !!(isEligibleForJoin || isBeingJoined),
	};
};

export const Area = connectActionState(mapStateToProps)(AreaComponent);
