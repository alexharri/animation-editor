import React from "react";
import { connectActionState } from "~/state/stateUtils";
import { contractRect } from "~/util/math";
import { AreaReducerState } from "~/area/state/areaReducer";
import { getAreaToOpenTargetId } from "~/area/util/areaUtils";
import { useVec2TransitionState } from "~/hook/useNumberTransitionState";
import { useEffect } from "react";
import { AREA_BORDER_WIDTH } from "~/constants";
import { AreaComponent } from "~/area/components/Area";
import { areaComponentRegistry } from "~/area/areaRegistry";
import { compileStylesheetLabelled } from "~/util/stylesheets";
import AreaRootStyles from "~/area/components/AreaRoot.styles";

const s = compileStylesheetLabelled(AreaRootStyles);

interface OwnProps {
	areaToViewport: { [key: string]: Rect };
}
interface StateProps {
	areaState: AreaReducerState;
}
type Props = OwnProps & StateProps;

const AreaToOpenPreviewComponent: React.FC<Props> = (props) => {
	const { areaState } = props;
	const { areaToOpen } = areaState;

	const areaToOpenTargetId =
		areaToOpen && getAreaToOpenTargetId(areaToOpen.position, areaState, props.areaToViewport);
	const areaToOpenTargetViewport = areaToOpenTargetId && props.areaToViewport[areaToOpenTargetId];

	const [areaToOpenDimensions, setAreaToOpenDimensions] = useVec2TransitionState(
		Vec2.new(100, 100),
		{ duration: 250, bezier: [0.24, 0.02, 0.18, 0.97] },
	);

	useEffect(() => {
		if (!areaToOpenTargetId) {
			return;
		}

		const viewport = props.areaToViewport[areaToOpenTargetId];

		setAreaToOpenDimensions(Vec2.new(viewport.width, viewport.height));
	}, [areaToOpenTargetId]);

	if (!areaToOpen || !areaToOpenTargetViewport) {
		return null;
	}

	return (
		<>
			<div
				className={s("areaToOpenContainer")}
				style={{
					left: areaToOpen.position.x,
					top: areaToOpen.position.y,
				}}
			>
				<AreaComponent
					id="-1"
					Component={areaComponentRegistry[areaToOpen.area.type]}
					raised
					state={areaToOpen.area.state}
					type={areaToOpen.area.type}
					viewport={{
						left: -(areaToOpenDimensions.x / 2),
						top: -(areaToOpenDimensions.y / 2),
						height: areaToOpenDimensions.y,
						width: areaToOpenDimensions.x,
					}}
				/>
			</div>
			<div
				className={s("areaToOpenTargetOverlay")}
				style={contractRect(areaToOpenTargetViewport, AREA_BORDER_WIDTH)}
			/>
		</>
	);
};

const mapStateToProps: MapActionState<StateProps> = ({ area }) => ({
	areaState: area,
});

export const AreaToOpenPreview = connectActionState(mapStateToProps)(AreaToOpenPreviewComponent);
