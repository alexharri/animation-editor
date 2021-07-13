import React, { useEffect, useMemo } from "react";
import { areaComponentRegistry } from "~/area/areaRegistry";
import { AreaComponent } from "~/area/components/Area";
import AreaRootStyles from "~/area/components/AreaRoot.styles";
import { AREA_PLACEMENT_TRESHOLD } from "~/area/state/areaConstants";
import { AreaReducerState } from "~/area/state/areaReducer";
import {
	getAreaToOpenPlacementInViewport,
	getHoveredAreaId,
	PlaceArea,
} from "~/area/util/areaUtils";
import { AREA_BORDER_WIDTH } from "~/constants";
import { useVec2TransitionState } from "~/hook/useNumberTransitionState";
import { connectActionState } from "~/state/stateUtils";
import { AreaToOpen } from "~/types/areaTypes";
import { contractRect } from "~/util/math";
import { compileStylesheetLabelled } from "~/util/stylesheets";

interface RenderAreaToOpenProps {
	viewport: Rect;
	areaToOpen: AreaToOpen;
	dimensions: Vec2;
}

const RenderAreaToOpen: React.FC<RenderAreaToOpenProps> = (props) => {
	const { areaToOpen, viewport, dimensions } = props;

	const placement = useMemo(() => {
		return getAreaToOpenPlacementInViewport(viewport, areaToOpen.position);
	}, [viewport, areaToOpen]);

	const treshold = Math.min(viewport.width, viewport.height) * AREA_PLACEMENT_TRESHOLD;
	const O = Vec2.new(treshold, treshold);

	const w = viewport.width;
	const h = viewport.height;

	const nw_0 = Vec2.new(0, 0);
	const nw_1 = nw_0.add(O);
	const ne_0 = Vec2.new(w, 0);
	const ne_1 = ne_0.add(O.scaleX(-1));
	const sw_0 = Vec2.new(0, h);
	const sw_1 = sw_0.add(O.scaleY(-1));
	const se_0 = Vec2.new(w, h);
	const se_1 = se_0.add(O.scale(-1));

	const lines = [
		[nw_0, nw_1],
		[ne_0, ne_1],
		[sw_0, sw_1],
		[se_0, se_1],
		[nw_1, ne_1],
		[ne_1, se_1],
		[se_1, sw_1],
		[sw_1, nw_1],
	];

	const placementLines: Record<PlaceArea, Vec2[]> = {
		left: [nw_0, nw_1, sw_1, sw_0],
		top: [nw_0, ne_0, ne_1, nw_1],
		right: [ne_1, ne_0, se_0, se_1],
		bottom: [sw_0, sw_1, se_1, se_0],
		replace: [nw_1, ne_1, se_1, sw_1],
	};

	const hlines = placementLines[placement];
	const hd =
		hlines
			.map((p) => [p.x, p.y].join(","))
			.map((str, i) => [i === 0 ? "M" : "L", str].join(" "))
			.join(" ") + " Z";

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
						left: -(dimensions.x / 2),
						top: -(dimensions.y / 2),
						height: dimensions.y,
						width: dimensions.x,
					}}
				/>
			</div>
			<div
				className={s("areaToOpenTargetOverlay")}
				style={contractRect(viewport, AREA_BORDER_WIDTH)}
			>
				<svg width={w} height={h} className={s("placement")}>
					{lines.map(([p0, p1], i) => (
						<line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} />
					))}
					<path d={hd} />
				</svg>
			</div>
		</>
	);
};

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
		areaToOpen && getHoveredAreaId(areaToOpen.position, areaState, props.areaToViewport);

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
		<RenderAreaToOpen
			areaToOpen={areaToOpen}
			dimensions={areaToOpenDimensions}
			viewport={areaToOpenTargetViewport}
		/>
	);
};

const mapStateToProps: MapActionState<StateProps> = ({ area }) => ({
	areaState: area,
});

export const AreaToOpenPreview = connectActionState(mapStateToProps)(AreaToOpenPreviewComponent);
