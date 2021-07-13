import { areaOperations } from "~/area/areaOperations";
import { areaActions } from "~/area/state/areaActions";
import { computeAreaToViewport } from "~/area/util/areaToViewport";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId } from "~/area/util/areaUtils";
import { getAreaRootViewport } from "~/area/util/getAreaViewport";
import { RequestActionParams } from "~/listener/requestAction";
import { performOperation } from "~/state/operation";
import { getActionState } from "~/state/stateUtils";
import { Area } from "~/types/areaTypes";
import { mouseDownMoveAction } from "~/util/action/mouseDownMoveAction";

interface Options {
	area: Area;
}

export const dragOpenArea = (e: React.MouseEvent, options: Options) => {
	const { area } = options;

	let position: Vec2;

	const onDone = (params: RequestActionParams) => {
		const { area: areaState } = getActionState();
		const rootViewport = getAreaRootViewport();
		const areaToViewport = computeAreaToViewport(
			areaState.layout,
			areaState.rootId,
			rootViewport,
		);

		let areaId = getHoveredAreaId(position, areaState, areaToViewport);

		if (!areaId) {
			params.cancelAction(); // Mouse is not over any area, cancel
			return;
		}

		const viewport = areaToViewport[areaId];
		const placement = getAreaToOpenPlacementInViewport(viewport, position);

		performOperation(params, (op) => areaOperations.dragArea(op, area, areaId!, placement));
		params.submitAction();
	};

	mouseDownMoveAction(e, {
		keys: [],
		beforeMove: (_params, { mousePosition }) => {
			position = mousePosition.global;
		},
		mouseMove: (params, { mousePosition }) => {
			position = mousePosition.global;
			params.dispatch(areaActions.setFields({ areaToOpen: { area, position } }));
		},
		mouseUp: (params, didMove) => {
			if (!didMove) {
				params.dispatch(areaActions.setFields({ areaToOpen: { area, position } }));
				return;
			}
			onDone(params);
		},
		mouseDown: (params) => {
			onDone(params);
		},
	});
};
