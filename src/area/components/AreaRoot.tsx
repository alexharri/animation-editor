import React from "react";
import { useRef } from "react";
import { useRefRect } from "~/hook/useRefRect";
import { Area } from "~/area/components/Area";
import { connectActionState } from "~/state/stateUtils";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { AreaState } from "~/area/state/areaReducer";
import { JoinAreaPreview } from "~/area/components/JoinAreaPreview";
import { compileStylesheet } from "~/util/stylesheets";
import { AreaRowSeparators } from "~/area/components/AreaRowSeparators";
import { GlobalElementIds } from "~/constants";
import { cssZIndex } from "~/cssVariables";

const s = compileStylesheet(({ css }) => ({
	root: css`
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
	`,

	cursorCapture: css`
		display: none;

		&--active {
			position: absolute;
			display: block;
			top: 0;
			left: 0;
			bottom: 0;
			right: 0;
			z-index: ${cssZIndex.area.cursorCapture};
			cursor: not-allowed;
		}
	`,
}));

interface StateProps {
	areaState: AreaState;
}
type Props = StateProps;

const AreaRootComponent: React.FC<Props> = props => {
	const root = useRef<HTMLDivElement>(null);
	const viewport = useRefRect(root);
	const { joinPreview } = props.areaState;

	const areaToViewport = (viewport && computeAreaToViewport(props.areaState, viewport)) || {};

	return (
		<div id={GlobalElementIds.AreaViewportRoot} className={s("root")} ref={root}>
			{viewport &&
				Object.keys(props.areaState.layout).map(id => {
					const layout = props.areaState.layout[id];

					if (layout.type === "area_row") {
						return (
							<AreaRowSeparators
								key={id}
								areaToViewport={areaToViewport}
								row={layout}
							/>
						);
					}

					return <Area key={id} viewport={areaToViewport[id]} id={id} />;
				})}
			{joinPreview && joinPreview.areaId && (
				<JoinAreaPreview
					viewport={areaToViewport[joinPreview.areaId]}
					movingInDirection={joinPreview.movingInDirection!}
				/>
			)}
			<div className={s("cursorCapture", { active: !!props.areaState.joinPreview })} />
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps> = ({ area }) => ({
	areaState: area,
});

export const AreaRoot = connectActionState(mapStateToProps)(AreaRootComponent);
