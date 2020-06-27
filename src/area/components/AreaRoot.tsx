import "~/util/math/expressions";

import React, { useState, useEffect, useRef } from "react";
import { Area } from "~/area/components/Area";
import { connectActionState } from "~/state/stateUtils";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { JoinAreaPreview } from "~/area/components/JoinAreaPreview";
import { AreaRowSeparators } from "~/area/components/AreaRowSeparators";
import { getAreaRootViewport, _setAreaViewport } from "~/area/util/getAreaViewport";
import { AreaReducerState } from "~/area/state/areaReducer";
import { AreaToOpenPreview } from "~/area/components/AreaToOpenPreview";
import AreaRootStyles from "~/area/components/AreaRoot.styles";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(AreaRootStyles);

interface StateProps {
	layout: AreaReducerState["layout"];
	rootId: string;
	joinPreview: AreaReducerState["joinPreview"];
}
type Props = StateProps;

const AreaRootComponent: React.FC<Props> = (props) => {
	const { joinPreview } = props;

	const viewportMapRef = useRef<{ [areaId: string]: Rect }>({});

	const [viewport, setViewport] = useState(getAreaRootViewport());

	useEffect(() => {
		const fn = () => setViewport(getAreaRootViewport());
		window.addEventListener("resize", fn);
		return () => window.removeEventListener("resize", fn);
	});

	{
		const newMap =
			(viewport && computeAreaToViewport(props.layout, props.rootId, viewport)) || {};

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

	return (
		<div data-area-root>
			{viewport &&
				Object.keys(props.layout).map((id) => {
					const layout = props.layout[id];

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
			<AreaToOpenPreview areaToViewport={areaToViewport} />
			<div className={s("cursorCapture", { active: !!joinPreview })} />
		</div>
	);
};

const mapStateToProps: MapActionState<StateProps> = ({ area }) => ({
	joinPreview: area.joinPreview,
	layout: area.layout,
	rootId: area.rootId,
});

export const AreaRoot = connectActionState(mapStateToProps)(AreaRootComponent);
