import "~/util/math/expressions";

import React, { useState, useEffect, useRef } from "react";
import { Area, AreaComponent } from "~/area/components/Area";
import { connectActionState } from "~/state/stateUtils";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { AreaReducerState } from "~/area/state/areaReducer";
import { JoinAreaPreview } from "~/area/components/JoinAreaPreview";
import { compileStylesheet } from "~/util/stylesheets";
import { AreaRowSeparators } from "~/area/components/AreaRowSeparators";

import { cssZIndex, cssVariables } from "~/cssVariables";
import { getAreaRootViewport, _setAreaViewport } from "~/area/util/getAreaViewport";
import { areaComponentRegistry } from "~/area/areaRegistry";
import { getAreaToOpenTargetId } from "~/area/util/areaUtils";
import { contractRect } from "~/util/math";
import { AREA_BORDER_WIDTH } from "~/constants";
import { useVec2TransitionState } from "~/hook/useNumberTransitionState";

const s = compileStylesheet(({ css, keyframes }) => {
	const areaToOpenContainerAnimation = keyframes`
		0% { transform: scale(0.25); opacity: .3 }
		50% { transform: scale(0.52); opacity: .8; }
		100% { transform: scale(0.5); }
	`;
	return {
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

		areaToOpenContainer: css`
			z-index: ${cssZIndex.area.areaToOpen};
			transform: scale(0.5);
			position: absolute;
			opacity: 0.8;
			animation: ${areaToOpenContainerAnimation} 0.3s;
			cursor: grabbing;

			& > * > * {
				pointer-events: none;
			}
		`,

		areaToOpenTargetOverlay: css`
			z-index: ${cssZIndex.area.areaToOpenTarget};
			position: absolute;
			background: ${cssVariables.primary700};
			border-radius: 8px;
			opacity: 0.1;
		`,
	};
});

interface StateProps {
	areaState: AreaReducerState;
}
type Props = StateProps;

const AreaRootComponent: React.FC<Props> = (props) => {
	const { areaState } = props;
	const { joinPreview, areaToOpen } = areaState;

	const viewportMapRef = useRef<{ [areaId: string]: Rect }>({});

	const [viewport, setViewport] = useState(getAreaRootViewport());

	useEffect(() => {
		const fn = () => setViewport(getAreaRootViewport());
		window.addEventListener("resize", fn);
		return () => window.removeEventListener("resize", fn);
	});

	{
		const newMap =
			(viewport && computeAreaToViewport(areaState.layout, areaState.rootId, viewport)) || {};

		const map = viewportMapRef.current;

		const keys = Object.keys(newMap);
		const rectKeys: Array<keyof Rect> = ["height", "left", "top", "width"];
		viewportMapRef.current = keys.reduce<{ [areaId: string]: Rect }>((obj, key) => {
			const a = map[key];
			const b = newMap[key];

			let shouldUpdate = !a;

			if (!shouldUpdate) {
				for (let i = 0; i < rectKeys.length; i += 1) {
					const k = rectKeys[i];
					if (a[k] !== b[k]) {
						shouldUpdate = true;
						break;
					}
				}
			}

			obj[key] = shouldUpdate ? b : a;
			return obj;
		}, {});
	}

	const areaToViewport = viewportMapRef.current;
	_setAreaViewport(areaToViewport);

	const areaToOpenTargetId =
		areaToOpen && getAreaToOpenTargetId(areaToOpen.position, areaState, areaToViewport);
	const areaToOpenTargetViewport = areaToOpenTargetId && areaToViewport[areaToOpenTargetId];

	const [areaToOpenDimensions, setAreaToOpenDimensions] = useVec2TransitionState(
		Vec2.new(100, 100),
		{ duration: 250, bezier: [0.24, 0.02, 0.18, 0.97] },
	);

	useEffect(() => {
		if (!areaToOpenTargetId) {
			return;
		}

		const viewport = areaToViewport[areaToOpenTargetId];

		setAreaToOpenDimensions(Vec2.new(viewport.width, viewport.height));
	}, [areaToOpenTargetId]);

	return (
		<div data-area-root>
			{viewport && areaToOpen && (
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
			)}
			{viewport &&
				Object.keys(areaState.layout).map((id) => {
					const layout = areaState.layout[id];

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
			{areaToOpenTargetViewport && (
				<div
					className={s("areaToOpenTargetOverlay")}
					style={contractRect(areaToOpenTargetViewport, AREA_BORDER_WIDTH)}
				/>
			)}
			<div className={s("cursorCapture", { active: !!joinPreview })} />
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps> = ({ area }) => ({
	areaState: area,
});

export const AreaRoot = connectActionState(mapStateToProps)(AreaRootComponent);
